import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InsightFocusArea, INSIGHT_FOCUS_AREAS } from '@/types/insights'
import { auth } from '@clerk/nextjs/server'
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client'

// Debug environment variables to diagnose issues
console.log('==== SEARCH API ENVIRONMENT DEBUG ====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('TAVILY_API_KEY available (masked):', process.env.TAVILY_API_KEY ? '***-exists-***' : 'NOT FOUND');
console.log('======================================');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

// Add debug logging for the API key
console.log('Tavily API Key available:', !!TAVILY_API_KEY);

if (!TAVILY_API_KEY) {
  console.warn('WARNING: TAVILY_API_KEY is not configured in environment variables');
}

interface SearchResult {
  title: string
  content: string
  url: string
  source?: string
  score: number
}

export async function GET(request: Request): Promise<Response> {
  // Add a URL parameter to enable detailed debugging
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const focusArea = searchParams.get('focusArea') as InsightFocusArea || 'challenges-barriers'
  const industriesParam = searchParams.get('industries') || ''
  const industries = industriesParam ? industriesParam.split(',') : []
  const debug = searchParams.get('debug') === 'true'
  
  // Debug output if requested
  if (debug) {
    return NextResponse.json({
      debug: {
        environment: process.env.NODE_ENV,
        tavily_key_exists: !!TAVILY_API_KEY,
        tavily_key_first_chars: TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 4) + '...' : 'N/A',
        query,
        focusArea,
        industries
      }
    })
  }
  
  // Validate required parameters
  if (!focusArea || !Object.keys(INSIGHT_FOCUS_AREAS).includes(focusArea)) {
    return NextResponse.json(
      { error: 'Invalid or missing focus area' },
      { status: 400 }
    )
  }

  // Check user's usage before proceeding
  const authData = await auth()
  const userId = authData.userId
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's subscription status first
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { 
        userId,
        status: 'active'
      }
    })

    const isPremium = userSubscription?.plan === 'pro'
    const limit = isPremium ? 100 : 20 // Pro users get 100 searches per day, free users get 20 total

    // Check current usage
    const currentUsage = await prisma.usageTracker.findFirst({
      where: {
        userId,
        featureId: INSIGHT_SEARCH_FEATURE,
        ...(isPremium ? {
          lastUsedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        } : {})
      }
    })

    // If no usage record exists, create one
    if (!currentUsage) {
      await prisma.usageTracker.create({
        data: {
          userId,
          featureId: INSIGHT_SEARCH_FEATURE,
          count: 1,
          lastUsedAt: new Date()
        }
      })
    } else if (currentUsage.count >= limit) {
      return NextResponse.json(
        { 
          error: isPremium ? 'Daily usage limit reached' : 'Total usage limit reached. Please upgrade to Pro to continue searching.',
          limitReached: true,
          limit,
          isPremium
        },
        { status: 403 }
      )
    } else {
      // Increment usage
      await prisma.usageTracker.update({
        where: { id: currentUsage.id },
        data: { 
          count: currentUsage.count + 1,
          lastUsedAt: new Date()
        }
      })
    }

    // Continue with the search...
    const searchQuery = `${query} ${INSIGHT_FOCUS_AREAS[focusArea].description}`
    const searchTimeout = 30000 // 30 seconds timeout

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), searchTimeout)

    try {
      // Log the search query and parameters
      console.log('Search request:', {
        query: searchQuery,
        focusArea,
        includeIndustries: industries
      });
      
      if (!TAVILY_API_KEY) {
        throw new Error('TAVILY_API_KEY is missing. Please configure it in your environment variables.');
      }
      
      // Call the real Tavily API
      console.log('Calling Tavily API with key:', TAVILY_API_KEY ? 'Key exists' : 'No key found');
      
      try {
        const tavilyApiUrl = 'https://api.tavily.com/search';
        console.log('Calling Tavily API at URL:', tavilyApiUrl);
        
        const tavilyRequestBody = {
          query: searchQuery,
          search_depth: 'advanced',
          max_results: 10,
          include_domains: [
            'hbr.org',
            'mckinsey.com',
            'bcg.com',
            'prosci.com',
            'strategy-business.com',
            'deloitte.com',
            'accenture.com',
            'pwc.com',
            'kpmg.com',
            'ey.com',
            'gartner.com',
            'forrester.com',
            'forbes.com',
            'harvard.edu',
            'mit.edu',
            'stanford.edu',
            'change-management.com',
            'apm.org.uk',
            'pmi.org',
            'shrm.org'
          ],
          exclude_domains: [
            'youtube.com',
            'facebook.com',
            'twitter.com',
            'instagram.com',
            'tiktok.com',
            'reddit.com',
            'pinterest.com',
            'linkedin.com'
          ]
        };
        
        const response = await fetch(tavilyApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TAVILY_API_KEY}`
          },
          body: JSON.stringify(tavilyRequestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error(`Tavily API error: Status ${response.status}, Response:`, errorText);
          throw new Error(`Tavily Search API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Tavily search returned results:', data.results?.length || 0);
        
        // Validate response structure
        if (!data || !Array.isArray(data.results)) {
          console.error('Invalid Tavily API response structure:', data);
          throw new Error('Invalid response from Tavily API: results not found or not an array');
        }
        
        const results = data.results as SearchResult[];

        // Process and format the results
        const formattedResults = results.map(result => {
          // Handle potentially missing or malformed data
          if (!result) {
            console.warn('Empty result found in Tavily response');
            return null;
          }
          
          // Safely handle URLs
          let source = 'Unknown Source';
          let validUrl = result.url || '';
          
          try {
            // Make sure URL is valid and properly formatted
            if (validUrl && !validUrl.startsWith('http')) {
              validUrl = 'https://' + validUrl;
            }
            
            if (validUrl) {
              const urlObj = new URL(validUrl);
              source = result.source || urlObj.hostname;
            }
          } catch (error) {
            console.error('Error parsing URL:', result.url, error);
            // Keep default source
          }
          
          return {
            title: result.title || 'Untitled',
            summary: result.content || '',
            content: result.content || '',
            url: validUrl,
            source: source,
            focus_area: focusArea,
            readTime: Math.ceil((result.content?.split(' ').length || 0) / 200), // Approximate read time in minutes
            tags: [INSIGHT_FOCUS_AREAS[focusArea].label],
            created_at: new Date().toISOString()
          };
        }).filter(Boolean); // Remove any null entries

        return NextResponse.json({
          query: searchQuery,
          focusArea: focusArea,
          results: formattedResults
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
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Search request timed out' },
          { status: 504 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error processing search request:', error)
    // Enhanced error reporting
    const errorDetails = error instanceof Error 
      ? { 
          message: error.message, 
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          // Add more context for debugging
          tavily_api_key_exists: !!TAVILY_API_KEY,
          tavily_api_key_prefix: TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 4) + '...' : 'N/A',
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