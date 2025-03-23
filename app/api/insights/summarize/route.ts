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
- Capitalize The First Letter Of Each Word In The Title
- Maximum of 10 words
- Format with a single # character
- For example: "# Key Challenges And Barriers Of CRM Implementation"

SEARCH CONTEXT:
Search query: "${searchQuery}"
Focus area: ${focusAreaInfo.label}${industryContext ? ` | Industries: ${industryContext}` : ''}

Your summary should follow this exact structure:

## Insights
• Write exactly 7-10 comprehensive bullet points as if you are a senior change management consultant analyzing these sources
• Each bullet point MUST be a complete, self-contained insight with a full sentence structure
• Each bullet point should be 40-60 words and read like a polished, expert observation
• NEVER truncate or cut off sentences - ensure each bullet point is grammatically complete
• Incorporate both factual information from the sources AND your expert knowledge about ${focusAreaInfo.label}
• Each bullet should provide actionable value by including the "why it matters" or implications
• Make each insight substantive, nuanced, and reflective of deep change management expertise
• Avoid superficial observations, generic statements, or partial thoughts
• Write as if you are a senior change management consultant with 20+ years of experience
• Ensure insights connect directly to ${searchQuery} and ${focusAreaInfo.label}
• Write in professional UK English with proper punctuation and full sentences
• End each bullet point with proper punctuation (usually a full stop)
• Do NOT include bullet characters (·) at the end of sentences
• Do NOT include numbers at the end of bullet points

## References
• List all sources as markdown links
• Format: [Title](URL)
• Do NOT include "Unknown Source" or any source description after the link
• Include ALL sources from the provided insights

CRITICAL REQUIREMENTS:
1. Generate a concise, specific title (max 10 words) with The First Letter Of Each Word Capitalized
2. DO NOT include a Context section in your output
3. Write in professional UK English (using spellings like "organisation", "centre", "programme")
4. Write Insights as if you are a senior change management consultant providing expert analysis
5. Each insight MUST be a complete thought with no truncation - NEVER end a bullet point mid-sentence
6. Each bullet point should provide a complete, valuable insight that combines source information with expert analysis
7. The References section should contain ONLY the links, no additional descriptions
8. Do not include numbers at the end of bullet points
9. Do NOT include bullet characters (·) at the end of sentences

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