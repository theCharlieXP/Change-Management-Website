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
Your task is to create a comprehensive and well-structured summary from search results provided via Tavily search engine.

Guidelines for creating summaries:
1. Start with a descriptive title with a single # character
2. Create clearly marked sections with ## headings
3. Generate markdown-formatted content with proper headings, bullet points, and links
4. Format references as markdown links to the original sources
5. Focus specifically on ${focusArea.replace('-', ' ')} aspects of the content
6. Combine knowledge from internet sources with your understanding of change management
7. Present a balanced, evidence-based view that synthesizes multiple perspectives
8. Follow exactly the format instructions provided in the user's prompt
9. Include URLs in references as clickable markdown links`
          },
          {
            role: 'user',
            content: content
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