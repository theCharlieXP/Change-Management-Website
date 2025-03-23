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
          description: "Exactly what was searched, focus area selected, and industries selected (if applicable)"
        },
        {
          title: "Insights",
          description: "7-10 comprehensive bullet points written by a change management expert"
        },
        {
          title: "References",
          description: "List of all sources with markdown links"
        }
      ],
      style: "Use clean markdown formatting with minimal excess text. Use bullet points (•) for Insights."
    }
    
    const prompt = `Analyze the following information related to ${focusAreaInfo.label} and create a concise, expert-level summary. 

Start with a clear, descriptive title that accurately represents what was searched. Format requirements for the title:
- Begin with a capital letter
- Maximum of 10 words
- Format with a single # character
- For example: "# Challenges and Barriers of CRM Implementation"

SEARCH CONTEXT:
Search query: "${searchQuery}"
Focus area: ${focusAreaInfo.label}${industryContext ? ` | Industries: ${industryContext}` : ''}

Your summary should follow this exact structure:

## Context
${searchQuery}, ${focusAreaInfo.label}${industryContext ? `, ${industryContext}` : ''}

## Insights
• Write 7-10 comprehensive bullet points as if you are a senior change management consultant analyzing these sources
• Each bullet point should represent a key insight a change management expert would extract from the sources
• Incorporate both information from the sources AND expert knowledge about ${focusAreaInfo.label}
• Focus on actionable insights that would be valuable to change management practitioners
• Each bullet point should be 25-40 words and read like a polished, expert observation
• Make each insight substantive, nuanced, and reflective of deep change management expertise
• Avoid superficial observations or generic statements
• Ensure insights are specifically relevant to ${searchQuery} and ${focusAreaInfo.label}
• Write in professional UK English with proper punctuation
• Do NOT include bullet characters (·) at the end of sentences
• Do NOT include numbers at the end of bullet points

## References
• List all sources as markdown links
• Format: [Title](URL)
• Do NOT include "Unknown Source" or any source description after the link
• Include ALL sources from the provided insights

CRITICAL REQUIREMENTS:
1. Generate a concise, specific title (max 10 words) that accurately reflects the search topic
2. Format the Context section EXACTLY as: [search query], [focus area], [industries if applicable]
3. Write in professional UK English (using spellings like "organisation", "centre", "programme")
4. Write Insights as if you are a senior change management consultant providing expert analysis
5. Each insight should reflect deep expertise and knowledge of change management best practices
6. The References section should contain ONLY the links, no additional descriptions
7. Do not include numbers at the end of bullet points
8. Do NOT include bullet characters (·) at the end of sentences

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