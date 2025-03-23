import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NewsSearchAndSummarizer } from '@/lib/news-search-and-summarizer';
import { MockSearchAndSummarizer } from '@/lib/mock-search-and-summarizer';
import { INSIGHT_FOCUS_AREAS } from '@/types/insights';
import type { InsightFocusArea } from '@/types/insights';

// Set proper runtime for compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

// Version marker to help track deployment
export const PRODUCTION_VERSION = '1.0.2';

// Set this to true to use the mock implementation instead of real APIs
const USE_MOCK_IMPLEMENTATION = true;

export async function POST(request: Request) {
  try {
    console.log(`PRODUCTION VERSION ${PRODUCTION_VERSION} - Search and Summarize route activated at`, new Date().toISOString());
    console.log(`Using ${USE_MOCK_IMPLEMENTATION ? 'MOCK' : 'REAL'} implementation`);
    
    // Check authentication
    const authData = await auth();
    const { userId } = authData;
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { query, area_filter, summary_instructions } = body;
    
    // Log the production version info
    console.log('Production version:', PRODUCTION_VERSION);
    console.log('Request timestamp:', new Date().toISOString());
    console.log('Request parameters:', { query, area_filter, has_instructions: !!summary_instructions });
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      HAS_TAVILY_KEY: !!process.env.TAVILY_API_KEY,
      HAS_DEEPSEEK_KEY: !!process.env.DEEPSEEK_API_KEY
    });

    // Validate query
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return new NextResponse(
        JSON.stringify({ error: 'Valid query is required' }),
        { status: 400 }
      );
    }

    // Check API keys
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY || 'mock-tavily-key';
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'mock-deepseek-key';

    if (!process.env.TAVILY_API_KEY && !USE_MOCK_IMPLEMENTATION) {
      console.error('Tavily API key not configured');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Tavily API key not configured',
          details: {
            apiKeyAvailable: false,
            requiredFor: 'search functionality'
          }
        }),
        { status: 500 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY && !USE_MOCK_IMPLEMENTATION) {
      console.error('DeepSeek API key not configured');
      return new NextResponse(
        JSON.stringify({ 
          error: 'DeepSeek API key not configured',
          details: {
            apiKeyAvailable: false,
            requiredFor: 'summary generation'
          }
        }),
        { status: 500 }
      );
    }

    try {
      // Initialize the appropriate SearchAndSummarizer
      const summarizer = USE_MOCK_IMPLEMENTATION
        ? new MockSearchAndSummarizer(TAVILY_API_KEY, DEEPSEEK_API_KEY)
        : new NewsSearchAndSummarizer(TAVILY_API_KEY, DEEPSEEK_API_KEY);
      
      // For focus area, convert to the format expected by Tavily if provided
      let tavilyAreaFilter = null;
      if (area_filter && INSIGHT_FOCUS_AREAS[area_filter as InsightFocusArea]) {
        tavilyAreaFilter = INSIGHT_FOCUS_AREAS[area_filter as InsightFocusArea].label;
        console.log(`Mapped area filter ${area_filter} to ${tavilyAreaFilter}`);
      } else if (area_filter) {
        console.warn(`Unknown area filter: ${area_filter}, using null`);
      }
      
      // Perform search and summarization
      console.log('Performing search and summarization with:', {
        query,
        area_filter: tavilyAreaFilter,
        has_instructions: !!summary_instructions
      });
      
      // Set a timeout to prevent long-running requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('Search and summarize operation timed out after 60 seconds');
      }, 60000); // 60 second timeout
      
      try {
        const { summary, results } = await summarizer.search_and_summarize(
          query,
          tavilyAreaFilter,
          summary_instructions || '',
          controller.signal // Pass the AbortSignal to the search method
        );
        
        // Clear the timeout since operation completed
        clearTimeout(timeoutId);
        
        // Log success
        console.log('Search and summarization successful');
        console.log('Results count:', results.length);
        console.log('Summary first 200 chars:', summary.substring(0, 200));
        
        // Return the results
        return NextResponse.json({
          summary,
          results,
          query,
          focusArea: area_filter || 'general',
          version: PRODUCTION_VERSION,
          timestamp: new Date().toISOString(),
          mock: USE_MOCK_IMPLEMENTATION
        });
      } catch (timeoutError) {
        // Clear timeout in case of error
        clearTimeout(timeoutId);
        throw timeoutError;
      }
      
    } catch (error) {
      console.error('Error in search and summarize operation:', error);
      
      // Create a more detailed error response
      const errorDetails: Record<string, any> = {
        message: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      };
      
      // Add stack trace in development
      if (process.env.NODE_ENV === 'development' && error instanceof Error) {
        errorDetails.stack = error.stack;
      }
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('Tavily API')) {
          errorDetails.service = 'Tavily';
          errorDetails.stage = 'search';
        } else if (error.message.includes('DeepSeek API')) {
          errorDetails.service = 'DeepSeek';
          errorDetails.stage = 'summary';
        }
      }
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to search and summarize',
          details: errorDetails
        }),
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in search-and-summarize route:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Unexpected error processing request',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { status: 500 }
    );
  }
} 