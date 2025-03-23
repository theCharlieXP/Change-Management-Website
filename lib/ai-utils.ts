// Production version 2.0.1
import { InsightFocusArea } from '@/types/insights'

/**
 * Direct DeepSeek API call with custom prompt
 * This function provides a direct pass-through to the DeepSeek API
 * without any post-processing or content manipulation
 */
export async function directDeepSeekQuery(customPrompt: string, userContent: string): Promise<string> {
  console.log('DIRECT DEEPSEEK CALL - No formatters - V2.0.1');
  
  // Server-side only check
  if (typeof window !== 'undefined') {
    console.error('directDeepSeekQuery was called on the client side - this should never happen');
    throw new Error('Cannot call DeepSeek API from client side');
  }

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  
  if (!DEEPSEEK_API_KEY) {
    console.warn('WARNING: DEEPSEEK_API_KEY is not configured for direct query');
    return '<!-- ERROR: DeepSeek API key missing for direct query -->\n\n# Error: API Key Missing\n\nCould not process your request because the DeepSeek API key is missing.';
  }

  console.log('Making direct DeepSeek API call with custom prompt');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
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
              content: customPrompt
            },
            {
              role: 'user',
              content: userContent
            }
          ],
          temperature: 0.1,
          max_tokens: 2500
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`Direct DeepSeek API error (${response.status}):`, errorText);
        return `<!-- ERROR: DeepSeek API returned ${response.status} -->\n\n# Error: API Request Failed\n\nThe DeepSeek API request failed with status ${response.status}.`;
      }

      const data = await response.json();
      console.log('Direct DeepSeek API response received - returning raw content');
      
      // Return the raw response without any post-processing
      return data.choices[0].message.content;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Error in direct DeepSeek fetch:', fetchError);
      return `<!-- ERROR: DeepSeek API fetch failed -->\n\n# Error: API Fetch Failed\n\nThe request to the DeepSeek API failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`;
    }
    
  } catch (error) {
    console.error('Error in direct DeepSeek query:', error);
    return `<!-- ERROR: DeepSeek API general error -->\n\n# Error: API Error\n\nAn unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Summarize content using DeepSeek API with the custom prompt format
 * This is a complete rebuild based on the custom-deepseek page
 */
export async function summarizeWithDeepseek(content: string, focusArea: InsightFocusArea): Promise<string> {
  // Log production version to confirm deployment
  console.log('PRODUCTION VERSION 2.0.1 - DeepSeek with Custom Prompt Format - NO CONTEXT SECTION');
  
  // Server-side only check
  if (typeof window !== 'undefined') {
    console.error('summarizeWithDeepseek was called on the client side - this should never happen');
    throw new Error('Cannot call DeepSeek API from client side');
  }

  // Get API key
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  
  // Log API key information (not the actual key)
  console.log('DeepSeek API Key available:', !!DEEPSEEK_API_KEY);
  console.log('API Key length:', DEEPSEEK_API_KEY?.length || 0);
  console.log('Focus area for DeepSeek call:', focusArea);
  console.log('Content length:', content.length);
  
  // Provide fallback if API key is missing
  if (!DEEPSEEK_API_KEY) {
    console.warn('WARNING: DEEPSEEK_API_KEY is not configured in environment variables');
    console.log('Environment info:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL
    });
    
    return generateFallbackResponse(content, focusArea);
  }

  // Use exact prompt from custom-deepseek page with explicit instructions to avoid CONTEXT section
  const systemPrompt = `You are an expert in change management who provides insightful analysis.
Please analyze the provided content and create a summary in the following format:
# Title (Use Title Case)

## Insights
• Write 7-10 bullet points using the information received from the internet and your own knowledge based on what was searched and what focus area was selected.

## References
[Include any relevant source links if available]

IMPORTANT FORMATTING RULES:
1. DO NOT include a Context section - this is strictly prohibited
2. Only use the exact sections specified above: Title, Insights, and References
3. Make sure to be thorough in your analysis and provide actionable insights in full sentences
4. Write in UK English

Your analysis will be rejected if it includes a Context, Overview, or Background section.`;

  console.log('V2.0.1 - Using updated prompt with explicit instructions to avoid CONTEXT section');
  
  try {
    console.log('Preparing DeepSeek API call with custom-deepseek prompt');
    
    // Use AbortController for timeout safety
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
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
              content: systemPrompt
            },
            {
              role: 'user',
              content: content
            }
          ],
          temperature: 0.1,
          max_tokens: 2500
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`DeepSeek API error (${response.status}):`, errorText);
        throw new Error(`Deepseek API error: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      console.log('V2.0.0 - DeepSeek API response received successfully');
      
      // Return raw response without any post-processing
      return data.choices[0].message.content;
    
    } catch (fetchError) {
      // Clear timeout in case of error
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Error calling Deepseek API:', error instanceof Error ? error.message : error);
    
    // Use fallback with same sections as requested prompt
    return generateFallbackResponse(content, focusArea);
  }
}

/**
 * Generate a fallback response when the API is unavailable
 */
function generateFallbackResponse(content: string, focusArea: InsightFocusArea): string {
  // Generate a title based on the focus area
  const title = generateTitle(content, focusArea);
  
  return `<!-- EMERGENCY FALLBACK: DeepSeek API unavailable -->

# ${title}

## Insights

• Effective change management requires strategic planning and stakeholder engagement to ensure successful adoption of new processes and minimize resistance.
• Communication is a critical success factor in change initiatives, serving as the foundation for building trust and reducing uncertainty among affected employees.
• Organizations that establish clear metrics for measuring change progress are better positioned to make timely adjustments and demonstrate value to leadership.
• Executive sponsorship provides necessary resources and signals organizational commitment, significantly increasing the likelihood of successful change implementation.
• Building a coalition of change champions across departments creates broader ownership and accelerates adoption of new systems or processes.
• Customized training programs ensure employees have the necessary skills to operate effectively in the changed environment, reducing productivity dips.
• Post-implementation support addresses emerging challenges and reinforces new behaviors until they become organizational norms.

## References

[Source information not available due to API error]`;
}

/**
 * Generate a title based on the content and focus area
 */
function generateTitle(content: string, focusArea: InsightFocusArea): string {
  // Default title if we can't extract anything
  let title = "Change Management Insights";
  
  try {
    // Try to extract a query from the content
    const queryMatch = content.match(/query:\s*([^\n]+)/i);
    if (queryMatch && queryMatch[1]) {
      title = queryMatch[1].trim();
    }
    
    // Capitalize the first letter of each word
    title = title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
  } catch (e) {
    console.error('Error generating title:', e);
  }
  
  return title;
} 