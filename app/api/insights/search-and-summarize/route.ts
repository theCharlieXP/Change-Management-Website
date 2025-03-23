import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NewsSearchAndSummarizer } from '@/lib/news-search-and-summarizer';
import { INSIGHT_FOCUS_AREAS } from '@/types/insights';
import type { InsightFocusArea } from '@/types/insights';

// Set proper runtime for compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

// Version marker to help track deployment
export const PRODUCTION_VERSION = '1.0.0';

export async function POST(request: Request) {
  try {
    console.log('PRODUCTION VERSION 1.0.0 - Search and Summarize route activated at', new Date().toISOString());
    
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
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!TAVILY_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: 'Tavily API key not configured' }),
        { status: 500 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: 'DeepSeek API key not configured' }),
        { status: 500 }
      );
    }

    try {
      // Initialize the NewsSearchAndSummarizer
      const summarizer = new NewsSearchAndSummarizer(TAVILY_API_KEY, DEEPSEEK_API_KEY);
      
      // For focus area, convert to the format expected by Tavily if provided
      let tavilyAreaFilter = null;
      if (area_filter && INSIGHT_FOCUS_AREAS[area_filter as InsightFocusArea]) {
        tavilyAreaFilter = INSIGHT_FOCUS_AREAS[area_filter as InsightFocusArea].label;
      }
      
      // Perform search and summarization
      console.log('Performing search and summarization with:', {
        query,
        area_filter: tavilyAreaFilter,
        has_instructions: !!summary_instructions
      });
      
      const { summary, results } = await summarizer.search_and_summarize(
        query,
        tavilyAreaFilter,
        summary_instructions || ''
      );
      
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
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error in search and summarize operation:', error);
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to search and summarize',
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
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