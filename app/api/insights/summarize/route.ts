import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { summarizeWithDeepseek } from '@/lib/ai-utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightFocusArea } from '@/types/insights'

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { insights, focusArea } = body

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
Summary: ${insight.summary}
${insight.content ? `Content: ${Array.isArray(insight.content) ? insight.content.join('\n') : insight.content}` : ''}
`).join('\n---\n')

    // Generate the summary prompt based on the focus area
    const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea as InsightFocusArea]
    const prompt = `Please analyze the following insights related to ${focusAreaInfo.label} and create a comprehensive summary. Start with a clear, descriptive title that captures the main theme or key finding of the analysis (without any prefix like "Title:" or "Summary:"). Then, format the rest of the summary with the following sections, using clean formatting without any markdown symbols, hashtags, or asterisks:

Summary of Results
- Start each point with a simple bullet point (-)
- Keep points concise and clear
- Focus on key takeaways

Key Findings
- Start each point with a simple bullet point (-)
- Highlight the most important discoveries
- Keep points actionable and specific

Patterns
- Start each point with a simple bullet point (-)
- Identify recurring themes and trends
- Focus on meaningful connections

Follow-up Questions to Learn More
- Start each point with a simple bullet point (-)
- Frame questions to guide further research
- Focus on gaps in current knowledge

References
- Start each point with a simple bullet point (-)
- List key sources and materials
- Include relevant page numbers or sections if available

Format each section with the heading on its own line, followed by bullet points. Focus particularly on aspects related to ${focusAreaInfo.label} and ${focusAreaInfo.description}.

Here are the insights to analyze:

${content}`

    // Generate the summary using Deepseek
    let summary = await summarizeWithDeepseek(prompt, focusArea as InsightFocusArea)

    // Clean up the formatting to ensure consistency
    summary = summary
      .replace(/[#*]/g, '') // Remove any remaining hashtags or asterisks
      .replace(/\n{3,}/g, '\n\n') // Replace multiple blank lines with double line breaks
      .replace(/(?:^|\n)[-•]\s*/g, '\n- ') // Standardize bullet points
      .trim()

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