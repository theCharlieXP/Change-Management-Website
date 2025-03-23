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

    const systemMessage = `You are a senior change management expert creating a meta-analysis of change management insights.

YOUR OUTPUT MUST FOLLOW THIS EXACT FORMAT:

# Title With Every First Letter Capitalized

## Key Findings
• First key finding (complete sentence with expert analysis)
• Second key finding
• Etc. (3-5 total key findings)

## Different Perspectives
• First perspective (complete sentence explaining differing viewpoints)
• Second perspective
• Etc. (2-3 total perspectives)

## Actionable Recommendations
• First recommendation (specific, practical action steps)
• Second recommendation
• Etc. (2-3 total recommendations)

CRITICAL REQUIREMENTS:

1. TITLE FORMAT:
   - CAPITALIZE THE FIRST LETTER OF EVERY WORD
   - Example: "# Strategic Approaches To Digital Transformation"
   - Begin with a single # followed by a space

2. STRUCTURE:
   - Include ONLY the sections listed above
   - DO NOT include a Context section
   - DO NOT include any other sections

3. ALL BULLET POINTS MUST:
   - Begin with the • symbol
   - Be complete thoughts/sentences with proper punctuation
   - Reflect expert-level analysis (as a senior consultant)
   - Never be truncated or cut off mid-thought
   - Provide substantive, actionable insights
   - Be written in professional UK English

4. FOCUS ON SPECIFIC INSIGHTS:
   - Key Findings should identify the most frequent themes in order of importance
   - Different Perspectives should highlight contradictions with context
   - Recommendations should be specific and implementable

IMPORTANT: 
- If you include any additional sections, your work will be rejected
- If you don't capitalize the first letter of every word in the title, your work will be rejected
- If bullet points are superficial or generic, your work will be rejected`

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
        temperature: 0.1,
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