import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InsightFocusArea, INSIGHT_FOCUS_AREAS } from '@/types/insights'
import { auth } from '@clerk/nextjs/server'
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client'

// Set proper runtime for Prisma compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Debug environment variables to diagnose issues
console.log('==== SEARCH API ENVIRONMENT DEBUG ====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('TAVILY_API_KEY available (masked):', process.env.TAVILY_API_KEY ? '***-exists-***' : 'NOT FOUND');
console.log('TAVILY_API_KEY length:', process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.length : 0);
console.log('TAVILY_API_KEY prefix:', process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.substring(0, 8) : 'N/A');
console.log('======================================');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

// Add debug logging for the API key
console.log('Tavily API Key status:', {
  exists: !!TAVILY_API_KEY,
  validFormat: TAVILY_API_KEY?.startsWith('tvly-'),
  keyLength: TAVILY_API_KEY?.length,
  environment: process.env.NODE_ENV,
  prefix: TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 8) : 'N/A'
});

if (!TAVILY_API_KEY) {
  console.warn('WARNING: TAVILY_API_KEY is not configured in environment variables');
}

// IMPORTANT: For production deployment, ensure TAVILY_API_KEY is set in your environment variables
// In Vercel, set this in your project's environment variables settings

interface SearchResult {
  title: string
  content: string
  url: string
  source?: string
  score: number
}

export async function GET(request: Request): Promise<Response> {
  // Add more detailed error handling and logging
  try {
    // Check for the Tavily API key early
    if (!TAVILY_API_KEY) {
      console.error('FATAL ERROR: TAVILY_API_KEY is not configured in environment variables');
      return NextResponse.json(
        { 
          error: 'Search service configuration error', 
          details: 'The search service API key is missing. Please contact the administrator.'
        },
        { status: 500 }
      );
    }
    
    // Basic validation of API key format - Tavily API keys typically start with "tvly-"
    if (!TAVILY_API_KEY.startsWith('tvly-')) {
      console.warn('TAVILY_API_KEY may be invalid - does not start with expected prefix "tvly-"');
    }
    
    // Add a URL parameter to enable detailed debugging
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const focusArea = searchParams.get('focusArea') as InsightFocusArea || 'challenges-barriers'
    const industriesParam = searchParams.get('industries') || ''
    const industries = industriesParam ? industriesParam.split(',') : []
    const debug = searchParams.get('debug') === 'true'
    
    console.log('Search API request received:', {
      url: request.url,
      query,
      focusArea,
      industries,
      debug
    });
    
    // Debug output if requested
    if (debug) {
      return NextResponse.json({
        debug: {
          environment: process.env.NODE_ENV,
          tavily_key_exists: !!TAVILY_API_KEY,
          tavily_key_first_chars: TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 4) + '...' : 'N/A',
          tavily_key_length: TAVILY_API_KEY ? TAVILY_API_KEY.length : 0,
          query,
          focusArea,
          industries
        }
      })
    }
    
    // Validate required parameters
    if (!focusArea || !Object.keys(INSIGHT_FOCUS_AREAS).includes(focusArea)) {
      console.warn('Invalid focus area provided:', focusArea);
      return NextResponse.json(
        { error: 'Invalid or missing focus area' },
        { status: 400 }
      )
    }

    // Check user's usage before proceeding
    try {
      // Try to get authentication data, but handle failure gracefully
      let userId = null;
      try {
        const authData = await auth();
        userId = authData.userId;
      } catch (authError) {
        console.warn('Auth error (continuing as anonymous user):', authError instanceof Error ? authError.message : authError);
      }
      
      // Allow unauthenticated requests, but track usage for authenticated users if database connection is available
      if (userId) {
        try {
          // Get user's subscription status first
          const userSubscription = await prisma.userSubscription.findFirst({
            where: { 
              userId: userId as string,
              status: 'active'
            }
          });

          const isPremium = userSubscription?.plan === 'pro';
          const limit = isPremium ? 100 : 20; // Pro users get 100 searches per day, free users get 20 total

          // Check current usage
          const currentUsage = await prisma.usageTracker.findFirst({
            where: {
              userId: userId as string,
              featureId: INSIGHT_SEARCH_FEATURE,
              ...(isPremium ? {
                lastUsedAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              } : {})
            }
          });

          // If no usage record exists, create one
          if (!currentUsage) {
            await prisma.usageTracker.create({
              data: {
                userId: userId as string,
                featureId: INSIGHT_SEARCH_FEATURE,
                count: 1,
                lastUsedAt: new Date()
              }
            });
          } else if (currentUsage.count >= limit) {
            return NextResponse.json(
              { 
                error: isPremium ? 'Daily usage limit reached' : 'Total usage limit reached. Please upgrade to Pro to continue searching.',
                limitReached: true,
                limit,
                isPremium
              },
              { status: 403 }
            );
          } else {
            // Increment usage
            await prisma.usageTracker.update({
              where: { id: currentUsage.id },
              data: { 
                count: currentUsage.count + 1,
                lastUsedAt: new Date()
              }
            });
          }
        } catch (dbError) {
          // Log database error but continue with search
          console.error('Database error when checking usage (continuing with search):', dbError instanceof Error ? dbError.message : dbError);
          // If there's a PrismaClientInitializationError, it means the database connection failed
          if (dbError instanceof Error && dbError.name === 'PrismaClientInitializationError') {
            console.warn('Database connection error - skipping usage tracking');
          }
        }
      } else {
        console.log('Anonymous user accessing search API');
      }

      // Continue with the search...
      const searchQuery = `${query} ${INSIGHT_FOCUS_AREAS[focusArea].description}`
      const searchTimeout = 30000 // 30 seconds timeout

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), searchTimeout)

      // Log the search query and parameters
      console.log('Search request:', {
        query: searchQuery,
        focusArea,
        includeIndustries: industries
      });
      
      // Call the real Tavily API
      console.log('Calling Tavily API with key:', TAVILY_API_KEY ? 'Key exists' : 'No key found');
      console.log('Tavily API key prefix:', TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 8) : 'N/A');
      
      // Wrap the API call in a more resilient function to handle errors
      const callTavilyWithRetry = async (query: string): Promise<any> => {
        const maxRetries = 2;
        const baseDelay = 500; // 500ms base delay
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Tavily API call attempt ${attempt + 1}/${maxRetries + 1}`);
            
            // Use a simpler request body for more reliability
            const requestBody = {
              query: query,
              search_depth: 'advanced',
              max_results: 10,
              // Only include critical parameters to reduce chances of error
            };
            
            console.log('Tavily request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TAVILY_API_KEY}`
              },
              body: JSON.stringify(requestBody)
            });
            
            console.log('Tavily API response status:', response.status);
            
            if (!response.ok) {
              const errorText = await response.text().catch(() => 'Could not read error response');
              console.error(`Tavily API error: Status ${response.status}, Response:`, errorText);
              
              // If we got a 429 (too many requests), wait and retry
              if (response.status === 429 && attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                console.log(`Rate limited, retrying in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
              
              throw new Error(`Tavily Search API returned ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Tavily search returned results:', data.results?.length || 0);
            return data;
            
          } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            
            // Re-throw on final attempt
            if (attempt === maxRetries) throw error;
            
            // Otherwise wait and retry
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        // This shouldn't be reached due to the throw in the loop, but TypeScript needs it
        throw new Error('Failed to call Tavily API after retries');
      };
      
      try {
        const tavilyApiUrl = 'https://api.tavily.com/search';
        console.log('Calling Tavily API at URL:', tavilyApiUrl);
        
        const searchQuery = `${query} ${INSIGHT_FOCUS_AREAS[focusArea].description}`;
        console.log('Final search query:', searchQuery);
        
        // Call Tavily with retry logic
        const data = await callTavilyWithRetry(searchQuery);
        
        // Validate response structure
        if (!data || !Array.isArray(data.results)) {
          console.error('Invalid Tavily API response structure:', data);
          throw new Error('Invalid response from Tavily API: results not found or not an array');
        }
        
        // Define a type for Tavily search results
        interface TavilyResult {
          title?: string;
          content?: string;
          url?: string;
          source?: string;
          score?: number;
        }
        
        const results = data.results.map((result: TavilyResult) => ({
          title: result.title || 'Untitled',
          summary: result.content || '',
          content: result.content || '',
          url: result.url || '',
          source: result.source || '',
          focus_area: focusArea,
          readTime: Math.ceil((result.content?.split(' ')?.length || 0) / 200),
          tags: [INSIGHT_FOCUS_AREAS[focusArea].label],
          created_at: new Date().toISOString()
        }));
        
        return NextResponse.json({
          query: searchQuery,
          focusArea: focusArea,
          results: results
        });
      } catch (error) {
        console.error('Tavily API call error:', error);
        
        // Add more detailed logging
        if (error instanceof Error) {
          console.error('Tavily API error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
          });
        }

        // For network errors, provide a more specific message
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error(`Network error connecting to Tavily API: ${error.message}`);
        }
        
        throw error; // Re-throw to be handled by the outer catch
      }
    } catch (error) {
      console.error('Error in auth or usage tracking:', error);
      throw error; // Re-throw to be handled by the outer try/catch
    }
  } catch (error) {
    console.error('Top-level error in search API:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Search request timed out' },
        { status: 504 }
      )
    }
    
    // Enhanced error reporting
    const errorDetails = error instanceof Error 
      ? { 
          message: error.message, 
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          // Add more context for debugging
          tavily_api_key_exists: !!TAVILY_API_KEY,
          tavily_api_key_prefix: TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 8) + '...' : 'N/A',
          environment: process.env.NODE_ENV
        } 
      : 'Unknown error';
      
    return NextResponse.json(
      { 
        error: 'An error occurred while processing your request',
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

// Helper function to get default category ID
async function getDefaultCategoryId(): Promise<string | undefined> {
  const category = await prisma.category.findFirst({
    where: { name: 'Digital Transformation' },
  })
  return category?.id
}