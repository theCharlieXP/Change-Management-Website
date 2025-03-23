import { InsightFocusArea } from '@/types/insights'

export async function summarizeWithDeepseek(content: string, focusArea: InsightFocusArea): Promise<string> {
  // Server-side only - ensure we're not running on the client
  if (typeof window !== 'undefined') {
    console.error('summarizeWithDeepseek was called on the client side - this should never happen');
    throw new Error('Cannot call DeepSeek API from client side');
  }

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  
  // Add debug logging for the API key
  console.log('DeepSeek API Key available:', !!DEEPSEEK_API_KEY);
  console.log('Focus area for DeepSeek call:', focusArea);
  console.log('Content length for DeepSeek call:', content.length);
  
  if (!DEEPSEEK_API_KEY) {
    console.warn('WARNING: DEEPSEEK_API_KEY is not configured in environment variables');
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  // Define the system prompt - hard-coded to ensure it's always the same
  const systemPrompt = `You are a senior change management expert tasked with creating high-quality, insightful summaries.

MANDATORY FORMATTING RULES - YOU MUST FOLLOW THESE EXACTLY:
1. BEGIN WITH A TITLE THAT HAS EVERY FIRST LETTER CAPITALIZED
   - Example: "# Strategic Approaches To Change Management Implementation"
   - Use exactly one # symbol followed by a space
   - CAPITALIZE THE FIRST LETTER OF EVERY WORD
   - Maximum 10 words

2. STRUCTURE:
   - TITLE (as described above)
   - INSIGHTS SECTION (labeled "## Insights")
   - REFERENCES SECTION (labeled "## References")
   - DO NOT CREATE ANY OTHER SECTIONS
   - DO NOT CREATE A CONTEXT SECTION

3. INSIGHTS SECTION MUST:
   - Contain exactly 7-10 bullet points (using • symbol)
   - Each bullet must be a complete, grammatically perfect sentence or paragraph (40-60 words)
   - Each insight must be substantive, expert-level analysis
   - Each insight must combine source information with expert change management knowledge
   - Each insight must include actionable implications or "why it matters"
   - Never truncate or cut off sentences
   - End each point with proper punctuation
   - NEVER include bullet characters (·) at end of sentences
   - Write in professional UK English (organisation, programme, centre)

4. REFERENCES SECTION MUST:
   - Include only clean markdown links: [Title](URL)
   - No descriptive text after links
   - No "Unknown Source" placeholders

YOU WILL BE EVALUATED ON:
- Proper title capitalization (First Letter Of Each Word)
- Complete absence of any Context section
- Quality and completeness of each insight bullet point
- Professional, authoritative tone of a senior change management consultant`;

  console.log('Using system prompt:', systemPrompt.substring(0, 200) + '...');

  try {
    // Log request information (without full content to avoid log pollution)
    console.log('Preparing DeepSeek API call with temperature: 0.1, max_tokens: 2500');
    
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.1,
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
    console.log('Response first 200 chars:', data.choices?.[0]?.message?.content?.substring(0, 200) || 'No content');
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error calling Deepseek API:', error instanceof Error ? error.message : error)
    throw new Error('Failed to generate summary with Deepseek')
  }
} 