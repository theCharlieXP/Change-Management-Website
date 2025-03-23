import { NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

export async function POST(request: Request) {
  try {
    const { summaries, focusArea, focusAreaInfo } = await request.json()

    if (!Array.isArray(summaries) || summaries.length === 0) {
      return NextResponse.json({ error: 'No summaries provided' }, { status: 400 })
    }

    if (!DEEPSEEK_API_KEY) {
      throw new Error('Deepseek API key not configured')
    }

    const systemMessage = `You are an expert at analyzing and synthesizing change management insights, focusing specifically on ${focusAreaInfo.label}.
Your task is to create a comprehensive summary of multiple insights related to ${focusAreaInfo.label}, identifying the main themes and their frequency.

Context about this focus area:
${focusAreaInfo.description}

Create a summary with the following sections:

1. Key Findings (3-5 bullet points)
- List the main points in order of how frequently they appear across all summaries
- Combine similar points into unified insights
- Focus on actionable takeaways specific to ${focusAreaInfo.label}
- Ensure each bullet point is a complete, grammatically correct sentence or paragraph
- Never truncate sentences or leave thoughts incomplete
- Start with a descriptive title with The First Letter Of Each Word Capitalized

2. Different Perspectives (2-3 bullet points)
- Highlight any contradictions or differing viewpoints found in the sources
- Explain the context of these differences
- Provide complete thoughts with proper beginning and end

3. Actionable Recommendations (2-3 bullet points)
- Provide specific, practical steps based on the insights
- Focus on implementation within the context of ${focusAreaInfo.label}
- Ensure each recommendation is comprehensive and complete

Format each section with clear headers and bullet points starting with •
Write as if you are a senior change management consultant with 20+ years of experience
Never cut off sentences - ensure all bullet points are complete thoughts
DO NOT include a Context section in your output`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: summaries.join('\n\n') }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate summary')
    }

    const data = await response.json()
    return NextResponse.json({ summary: data.choices[0].message.content.trim() })
  } catch (error) {
    console.error('Summary generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    )
  }
} 