import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { summarizeWithDeepseek } from '@/lib/ai-utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightFocusArea } from '@/types/insights'

// Set proper runtime for compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

// Version marker to help track deployment
export const PRODUCTION_VERSION = '2.0.0';

export async function POST(request: Request) {
  try {
    console.log('PRODUCTION VERSION 2.0.0 - Summarize route activated at', new Date().toISOString());
    
    // Check authentication
    const authData = await auth();
    const { userId  } = authData
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { insights, focusArea, format, searchInfo } = body
    
    // Log the production version info
    console.log('Production version:', PRODUCTION_VERSION);
    console.log('Request timestamp:', searchInfo?._timestamp || 'Not specified');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      HAS_DEEPSEEK_KEY: !!process.env.DEEPSEEK_API_KEY
    });

    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No insights provided' }),
        { status: 400 }
      )
    }

    if (!focusArea || !INSIGHT_FOCUS_AREAS[focusArea as InsightFocusArea]) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid focus area' }),
        { status: 400 }
      )
    }

    // Prepare the content for summarization
    const content = insights.map(insight => `
Title: ${insight.title}
URL: ${insight.url}
${insight.content ? `Content: ${Array.isArray(insight.content) ? insight.content.join('\n') : insight.content}` : insight.summary ? `Content: ${insight.summary}` : ''}
`).join('\n---\n')

    // Add context from search query and industry if available
    const searchQuery = searchInfo?.query || '';
    const industryContext = searchInfo?.industries?.length > 0 
      ? `in the ${searchInfo.industries.join(', ')} ${searchInfo.industries.length > 1 ? 'industries' : 'industry'}`
      : '';
    
    // Add search context to the beginning of the content
    const contentWithContext = `SEARCH QUERY: ${searchQuery}
FOCUS AREA: ${INSIGHT_FOCUS_AREAS[focusArea as InsightFocusArea].label}
${industryContext ? `INDUSTRY CONTEXT: ${industryContext}` : ''}

CONTENT TO ANALYZE:
${content}`;

    console.log('Content prepared for DeepSeek API call');
    console.log('Content length:', contentWithContext.length);
    console.log('First 200 chars:', contentWithContext.substring(0, 200));
    
    try {
      // Generate the summary using DeepSeek with our clean implementation
      console.log('--- CALLING DEEPSEEK API WITH CUSTOM PROMPT (V2.0.0) ---');
      
      // Use the summarizeWithDeepseek function from ai-utils.ts
      // This function now uses the exact prompt from custom-deepseek
      let summary = await summarizeWithDeepseek(contentWithContext, focusArea as InsightFocusArea);
      
      // Add production version marker to summary
      summary = `<!-- PRODUCTION VERSION 2.0.0 -->\n${summary}`;
      
      // Log the first part of the summary for debugging
      console.log('Summary generated successfully, first 200 chars:');
      console.log(summary.substring(0, 200));
      
      // Return the raw, unmodified summary
      return NextResponse.json({ 
        summary,
        version: PRODUCTION_VERSION,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error generating summary:', error);
      
      return NextResponse.json(
        { 
          error: 'Failed to generate summary',
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in summarize route:', error);
    
    return NextResponse.json(
      { 
        error: 'Unexpected error processing request',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 