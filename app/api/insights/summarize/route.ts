import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { summarizeWithDeepseek } from '@/lib/ai-utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightFocusArea } from '@/types/insights'

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
Source: ${insight.source}
Summary: ${insight.summary}
${insight.content ? `Content: ${Array.isArray(insight.content) ? insight.content.join('\n') : insight.content}` : ''}
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
          description: "Outline what was searched for future reference"
        },
        {
          title: "Key Findings",
          description: "The most important points for the user to takeaway from their search (7-10 bullet points)"
        },
        {
          title: "References",
          description: "List of the sources used in the summary with their original links"
        }
      ],
      style: "Use markdown format with headings and concise, informative bullet points under each heading"
    }
    
    const prompt = `Please analyze the following insights related to ${focusAreaInfo.label} and create a comprehensive summary. Start with a clear, descriptive title that captures the main theme or key finding of the analysis preceded by a single # character (e.g., "# Key Strategies for Change Management").

SEARCH CONTEXT:
The user searched for: "${searchQuery}"
Focus area: ${focusAreaInfo.label} ${industryContext}
These results were found by the Tavily search engine based on this query.

The summary should have the following sections and formatting:

${summaryFormat.sections.map((section: { title: string, description: string }) => `## ${section.title}
${section.description}`).join('\n\n')}

${summaryFormat.style}

IMPORTANT INSTRUCTIONS:
1. The summary MUST include a title starting with a single # character
2. Each section MUST start with ## followed by the section title
3. In the References section, use markdown links in the format [Title](URL)
4. Include ALL sources from the provided insights in the References section
5. Be specific, factual, and evidence-based in your analysis
6. Focus particularly on aspects related to ${focusAreaInfo.label} and ${focusAreaInfo.description}
7. Use the information from the sources found by Tavily search engine
8. Make explicit reference to the search query "${searchQuery}" in your Context section

Here are the insights to analyze (these were found via Tavily search API):

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