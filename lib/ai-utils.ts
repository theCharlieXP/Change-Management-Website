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
1. Start with a descriptive, specific title (maximum 10 words) with The First Letter Of Each Word Capitalized
2. Format exactly as requested in the user's instructions
3. DO NOT include a Context section in your output
4. Write in UK English (using spellings like "organisation", "centre", "programme")
5. Write as a senior change management consultant providing expert analysis
6. Create comprehensive insights that reflect deep change management expertise
7. Format references as clean markdown links without source descriptions
8. Ensure insights are substantive, nuanced, and specifically relevant to the search topic
9. Present information in a professional, authoritative style
10. Avoid superficial observations or generic statements
11. Always use the bullet character • (not - or *) for all bullet points
12. Do NOT include bullet characters (·) at the end of sentences
13. End each bullet point with proper punctuation (typically a full stop)
14. Incorporate both source information AND expert knowledge about change management
15. Focus on insights that would be valuable to change management practitioners
16. Follow the user's instructions exactly for formatting and structure
17. Combine source information with expert knowledge to create value
18. NEVER truncate sentences - ensure all bullet points are complete thoughts
19. Each bullet point should be a full, grammatically complete sentence or paragraph
20. Write as if you have 20+ years of senior change management consulting experience`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.2,
        max_tokens: 2500
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