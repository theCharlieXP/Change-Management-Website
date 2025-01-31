import { NextResponse } from 'next/server'
import type { InsightFocusArea } from '@/types/insights'

interface SummaryInsight {
  title: string
  summary: string
  focusArea: InsightFocusArea
}

export async function POST(request: Request) {
  try {
    const { insights } = await request.json() as { insights: SummaryInsight[] }
    
    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      return NextResponse.json(
        { error: 'No insights provided' },
        { status: 400 }
      )
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'Deepseek API key not configured' },
        { status: 500 }
      )
    }

    // Prepare the content for summarization
    const content = insights.map(insight => {
      // Extract only the bullet points from the summary
      const bulletPoints = insight.summary
        .split('\n')
        .map(point => point.trim())
        .filter(point => point.startsWith('•') || point.startsWith('-'))
        .map(point => point.replace(/^[•-]\s*/, '').trim())
        .filter(point => point.length > 0)
        .map(point => `• ${point}`)
        .join('\n');

      return `
Title: ${insight.title}
Key Points:
${bulletPoints}
---`;
    }).join('\n');

    const systemMessage = `You are an expert in change management and business transformation, specifically focusing on ${insights[0].focusArea}.
Your task is to synthesize the key points from multiple insights that are already summarized in bullet-point format.

Rules for the summary:
1. Focus ONLY on consolidating and connecting the existing bullet points
2. Do not introduce new information not present in the bullet points
3. Combine similar points from different insights
4. Keep each bullet point concise (1-2 lines)
5. Start each point with a bullet (•)
6. Highlight key metrics and outcomes when mentioned
7. Maintain a professional, business-focused tone
8. Do not include any headers or categories
9. Ensure points flow logically from one to the next
10. Aim for a concise summary that captures the essence of all provided bullet points`

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
          { 
            role: 'user',
            content: `Please create a focused summary by synthesizing these pre-summarized insights:\n\n${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Deepseek API error: ${error}`)
    }

    const data = await response.json()
    const summary = data.choices[0].message.content

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error in summary generation:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
} 