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
          description: "A single line outlining the search query, focus area, and industry (if applicable)"
        },
        {
          title: "Key Findings",
          description: "7-10 informative bullet points in full sentences that provide actionable insights"
        },
        {
          title: "References",
          description: "List of all sources with markdown links"
        }
      ],
      style: "Use clean markdown formatting with minimal excess text. Use bullet points (•) for Key Findings."
    }
    
    const prompt = `Analyze the following insights related to ${focusAreaInfo.label} and create a concise, well-structured summary. Start with a clear, descriptive title that captures the main theme (e.g., "# Key Strategies for Change Management").

SEARCH CONTEXT:
Search query: "${searchQuery}"
Focus area: ${focusAreaInfo.label}${industryContext ? ` | Industry: ${industryContext}` : ''}

Your summary should follow this exact structure:

## Context
A single line that states what was searched, which focus area was selected, and what industry was selected (if applicable).

## Key Findings
• Create 7-10 informative bullet points in full sentences
• Focus on actionable insights tailored to the search query and focus area
• Ensure each bullet point is complete, clear, and valuable
• Extract and synthesize the most relevant information from the sources
• Avoid redundancy between points

## References
• List all sources as markdown links
• Format: [Title](URL)
• Do NOT include "Unknown Source" or any source description after the link
• Include ALL sources from the provided insights

CRITICAL REQUIREMENTS:
1. Write in a professional, clear style
2. Keep the Context section to a SINGLE line only
3. Ensure all bullet points are FULL SENTENCES
4. Make bullet points SPECIFIC and INFORMATIVE
5. The References section should contain ONLY the links, no additional descriptions
6. Focus specifically on ${focusAreaInfo.label} aspects of content

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