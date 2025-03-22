import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { summarizeWithDeepseek } from '@/lib/ai-utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightFocusArea } from '@/types/insights'

// Set proper runtime for compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
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

    // Generate the summary prompt based on the focus area
    const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea as InsightFocusArea]
    
    // Extract search context
    const searchQuery = searchInfo?.query || '';
    const industryContext = searchInfo?.industries?.length > 0 
      ? `in the ${searchInfo.industries.join(', ')} ${searchInfo.industries.length > 1 ? 'industries' : 'industry'}`
      : '';
    
    // Use the format from the request if provided, otherwise use default
    const summaryFormat = format || {
      sections: [
        {
          title: "Context",
          description: "A single line showing exactly what was searched, which focus area was selected, and which industries were selected (if applicable)"
        },
        {
          title: "Insights",
          description: "7-10 informative bullet points in full sentences that provide valuable information"
        },
        {
          title: "References",
          description: "List of all sources with markdown links"
        }
      ],
      style: "Use clean markdown formatting with minimal excess text. Use bullet points (•) for Insights."
    }
    
    const prompt = `Analyze the following information related to ${focusAreaInfo.label} and create a concise, well-structured summary. 

Start with a clear, descriptive title that accurately represents what was searched. The title should give the reader a good understanding of the topic and focus area. Format it with a single # character (e.g., "# Effective Change Management Strategies for Digital Transformation").

SEARCH CONTEXT:
Search query: "${searchQuery}"
Focus area: ${focusAreaInfo.label}${industryContext ? ` | Industries: ${industryContext}` : ''}

Your summary should follow this exact structure:

## Context
A single line that states exactly what was searched in the search bar, which focus area was selected, and which industries were selected (if applicable).

## Insights
• Create 7-10 informative bullet points in full sentences using UK English spelling
• Ensure each bullet point provides comprehensive, valuable information
• Incorporate your knowledge of change management to make insights more informative and complete
• Each bullet point should be a complete, well-formed sentence ending with proper punctuation
• Do NOT include numbers at the end of bullet points
• Extract and synthesize the most relevant information from the sources
• Focus on actionable insights tailored to the search query and focus area

## References
• List all sources as markdown links
• Format: [Title](URL)
• Do NOT include "Unknown Source" or any source description after the link
• Include ALL sources from the provided insights

CRITICAL REQUIREMENTS:
1. Generate a specific, descriptive title that accurately reflects the search topic
2. Write in professional UK English (using spellings like "organisation", "centre", "programme")
3. Keep the Context section to a SINGLE line showing exactly what was searched
4. Ensure all bullet points are FULL, COMPLETE sentences with proper punctuation
5. The References section should contain ONLY the links, no additional descriptions
6. Focus specifically on ${focusAreaInfo.label} aspects of content
7. Do not include numbers at the end of bullet points

Here are the insights to analyze (found via Tavily search):

${content}`

    // Generate the summary using Deepseek
    let summary = await summarizeWithDeepseek(prompt, focusArea as InsightFocusArea)

    // Ensure summary has proper markdown formatting
    if (!summary.trim().startsWith('# ')) {
      summary = `# Summary of Insights on ${focusAreaInfo.label}\n\n${summary}`;
    }

    return new NextResponse(
      JSON.stringify({ summary }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating summary:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 