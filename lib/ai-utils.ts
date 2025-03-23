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
  const systemPrompt = `You are a senior change management expert creating high-quality summaries.

MANDATORY OUTPUT FORMAT - YOUR WORK WILL BE REJECTED IF YOU DON'T FOLLOW THESE RULES:

1. TITLE:
   - Must begin with a single # character
   - Must have EVERY first letter of EVERY word capitalized
   - Example: "# Strategic Approaches To Change Management"
   - Must be concise (maximum 10 words)

2. STRUCTURE - MUST INCLUDE ONLY:
   - Title (as described above)
   - Insights section (labeled "## Insights")
   - References section (labeled "## References")
   - ABSOLUTELY NO CONTEXT SECTION - this will cause your work to be rejected

3. INSIGHTS SECTION:
   - Must contain 7-10 bullet points starting with the • symbol
   - Each bullet must be a complete thought in full sentences (40-60 words)
   - Each must read as expert-level analysis from a senior consultant
   - Each must include professional implications or "why it matters"
   - Never truncate sentences
   - Use professional UK English (organisation, centre, programme)

4. REFERENCES SECTION:
   - Include only clean markdown links: [Title](URL)
   - No descriptive text after links

YOU MUST NEVER:
- Include a Context section
- Fail to capitalize each first letter in the title
- Present superficial or generic insights
- Write incomplete sentences or analyses`;

  // Extract valuable content from the user input - ignore prompt instructions
  // because we will use our own consistent system prompt
  const extractedContent = extractContentFromPrompt(content);
  
  console.log('Using hard-coded system prompt for consistency');
  console.log('Extracted content length:', extractedContent.length);

  try {
    // Log request information
    console.log('Preparing DeepSeek API call with temperature: 0.1');
    
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
            content: extractedContent
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
    
    // Apply direct formatting before returning
    const rawResponse = data.choices[0].message.content;
    const formattedResponse = directlyFormatResponse(rawResponse);
    console.log('Directly formatted response, first 200 chars:', formattedResponse.substring(0, 200));
    
    return formattedResponse;
  } catch (error) {
    console.error('Error calling Deepseek API:', error instanceof Error ? error.message : error)
    throw new Error('Failed to generate summary with Deepseek')
  }
}

/**
 * Extracts the actual content to analyze from a prompt string
 * This prevents the caller from overriding our formatting requirements
 */
function extractContentFromPrompt(promptText: string): string {
  // Look for common content markers
  const contentMarkers = [
    'CONTENT TO ANALYZE:',
    'Analyze these insights from Tavily search:',
    'Here are the insights to analyze',
    'Analyze the following information'
  ];
  
  for (const marker of contentMarkers) {
    const index = promptText.indexOf(marker);
    if (index !== -1) {
      // Found a marker, extract everything after it
      return promptText.substring(index + marker.length).trim();
    }
  }
  
  // If no markers found, check if it starts with a structured insight
  if (promptText.includes('Title:') && promptText.includes('URL:')) {
    return promptText;
  }
  
  // If the content is very long, it's probably the actual content
  if (promptText.length > 500) {
    return promptText;
  }
  
  // Fallback - return as is but log a warning
  console.warn('Could not identify content section in prompt - using full text');
  return promptText;
}

/**
 * Directly formats the DeepSeek response to ensure it meets our requirements
 * This is a final safety net that runs inside the DeepSeek handler
 */
function directlyFormatResponse(text: string): string {
  console.log('Directly formatting DeepSeek response');
  
  // Step 1: Remove Context section if present
  let processed = text;
  if (processed.includes('## Context')) {
    console.log('Removing Context section directly in DeepSeek handler');
    processed = processed.replace(/## Context[\s\S]*?(?=##|$)/i, '');
  }
  
  // Step 2: Ensure title is properly formatted
  const titleMatch = processed.match(/# (.*?)(?:\r?\n|$)/i);
  if (titleMatch) {
    const originalTitle = titleMatch[0];
    const titleText = titleMatch[1];
    const capitalizedTitle = titleText
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    processed = processed.replace(originalTitle, `# ${capitalizedTitle}\n`);
    console.log('Directly reformatted title to:', `# ${capitalizedTitle}`);
  } else {
    // Add a title if none exists
    processed = `# Change Management Insights\n\n${processed}`;
    console.log('Added missing title');
  }
  
  // Step 3: Ensure we have an Insights section
  if (!processed.includes('## Insights')) {
    console.log('Adding missing Insights section');
    // Find a good place to insert it - after title
    const titleEndIndex = processed.indexOf('\n', processed.indexOf('#')) + 1;
    const firstPart = processed.substring(0, titleEndIndex);
    const lastPart = processed.substring(titleEndIndex);
    processed = `${firstPart}\n## Insights\n\n${lastPart}`;
  }
  
  // Step 4: Ensure sections are in the right order
  const sections = [];
  
  // Extract title
  const extractedTitle = processed.match(/# (.*?)(?=\r?\n|$)/i);
  if (extractedTitle) {
    sections.push(`# ${extractedTitle[1]}`);
  } else {
    sections.push('# Change Management Insights');
  }
  
  // Extract insights section
  const extractedInsights = processed.match(/## Insights\s*([\s\S]*?)(?=##|$)/i);
  if (extractedInsights && extractedInsights[1].trim()) {
    sections.push('## Insights\n\n' + extractedInsights[1].trim());
  } else {
    sections.push('## Insights\n\n• Default insight for change management.');
  }
  
  // Extract references section
  const extractedReferences = processed.match(/## References\s*([\s\S]*?)$/i);
  if (extractedReferences && extractedReferences[1].trim()) {
    sections.push('## References\n\n' + extractedReferences[1].trim());
  } else {
    // Try to find any links
    const links = processed.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
    if (links && links.length > 0) {
      sections.push('## References\n\n' + links.join('\n\n'));
    } else {
      sections.push('## References\n\n[Source information not available]');
    }
  }
  
  // Reconstruct the document with only the sections we want
  return sections.join('\n\n');
} 