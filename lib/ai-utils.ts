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
1. Start with a descriptive, specific title that accurately reflects what was searched
2. Format exactly as requested in the user's instructions
3. Keep the Context section to a single line showing exactly what was searched
4. Write in UK English (using spellings like "organisation", "centre", "programme")
5. Create comprehensive, detailed bullet points (minimum 20-30 words each)
6. Format references as clean markdown links without source descriptions
7. Focus on extracting key insights related to ${focusArea.replace('-', ' ')}
8. Present information in a professional, clear style
9. Avoid unnecessary words or filler content
10. Always use the bullet character • (not - or *) for all bullet points
11. Do not include numbers at the end of bullet points
12. Do NOT include bullet characters (·) at the end of sentences
13. End each bullet point with proper punctuation (typically a full stop)
14. Explain WHY each insight matters and its practical applications
15. Connect insights to real-world change management practices
16. Follow the user's instructions exactly for formatting and structure
17. Combine source information with expert knowledge to create value`
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