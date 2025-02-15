import { InsightFocusArea } from '@/types/insights'

export async function summarizeWithDeepseek(content: string, focusArea: InsightFocusArea): Promise<string> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing change management content, specifically focusing on ${focusArea.replace('-', ' ')}.
Your task is to extract insights that are SPECIFICALLY related to ${focusArea.replace('-', ' ')} from the content.

Guidelines for creating summaries:
1. ONLY extract insights that directly relate to ${focusArea.replace('-', ' ')}
2. Ignore information that doesn't specifically address ${focusArea.replace('-', ' ')}
3. Each bullet point must contain concrete examples or specific details about ${focusArea.replace('-', ' ')}
4. Include metrics, methodologies, or frameworks specific to ${focusArea.replace('-', ' ')} when present
5. Focus on unique approaches or unconventional wisdom about ${focusArea.replace('-', ' ')}
6. Emphasize the context and conditions that make these ${focusArea.replace('-', ' ')} insights valuable
7. Avoid generic statements - each point should be specific to this source's perspective on ${focusArea.replace('-', ' ')}`
          },
          {
            role: 'user',
            content: `Analyze the following content and extract 3-5 specific insights about ${focusArea.replace('-', ' ')}. Only include information that directly relates to ${focusArea.replace('-', ' ')}:

${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`Deepseek API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error calling Deepseek API:', error)
    throw new Error('Failed to generate summary with Deepseek')
  }
} 