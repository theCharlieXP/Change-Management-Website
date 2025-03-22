import { InsightFocusArea } from '@/types/insights'

export async function summarizeWithDeepseek(content: string, focusArea: InsightFocusArea): Promise<string> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  
  // Add debug logging for the API key
  console.log('DeepSeek API Key available:', !!DEEPSEEK_API_KEY);
  
  if (!DEEPSEEK_API_KEY) {
    console.warn('WARNING: DEEPSEEK_API_KEY is not configured in environment variables');
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  try {
    // Log request information (without full content to avoid log pollution)
    console.log('Calling DeepSeek API for focus area:', focusArea);
    
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
Your task is to create a concise, well-structured summary from search results provided via Tavily search engine.

Guidelines for creating summaries:
1. Start with a descriptive title with a single # character
2. Format exactly as requested in the user's instructions
3. Keep the Context section to a single line only
4. Create full sentence bullet points that are specific, actionable, and informative
5. Format references as clean markdown links without source descriptions
6. Focus on extracting key insights related to ${focusArea.replace('-', ' ')}
7. Present information in a professional, clear style
8. Avoid unnecessary words or filler content
9. Always use the bullet character • (not - or *) for all bullet points
10. Follow the user's instructions exactly for formatting and structure
11. Prioritize factual information from the sources`
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
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error(`DeepSeek API error (${response.status}):`, errorText);
      throw new Error(`Deepseek API error: ${response.statusText} (${response.status})`)
    }

    const data = await response.json()
    console.log('DeepSeek API response received, length:', data.choices?.[0]?.message?.content?.length || 0);
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error calling Deepseek API:', error instanceof Error ? error.message : error)
    throw new Error('Failed to generate summary with Deepseek')
  }
} 