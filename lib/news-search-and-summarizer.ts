/**
 * NewsSearchAndSummarizer - Class for handling Tavily search and DeepSeek summary generation
 * Version 1.0.4
 */

import { InsightFocusArea } from '@/types/insights';

// Tavily result interfaces
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score?: number;
  keywords?: string[];
}

interface TavilySearchResults {
  results: TavilySearchResult[];
  query: string;
  answer?: string;
  focusArea?: string;
  response_time?: string;
}

export class NewsSearchAndSummarizer {
  private tavily_api_key: string;
  private deepseek_api_key: string;
  
  constructor(tavily_api_key: string, deepseek_api_key: string) {
    this.tavily_api_key = tavily_api_key;
    this.deepseek_api_key = deepseek_api_key;
  }
  
  async search(
    query: string, 
    area_filter: string | null = null, 
    max_results: number = 5,
    signal?: AbortSignal
  ): Promise<TavilySearchResults> {
    console.log(`Performing Tavily search for: "${query}" with focus area: ${area_filter || 'none'}`);
    
    // Prepare the search parameters according to Tavily API documentation
    const search_params: Record<string, any> = {
      query: query,
      max_results: max_results,
      include_answer: true,
      include_raw_content: false,
      search_depth: "basic"
    };
    
    // Add topic parameter if area_filter is provided
    if (area_filter) {
      // Map the area_filter to a supported topic
      // Tavily only supports 'general' or 'news'
      search_params.topic = "general";
    }
    
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`Tavily API attempt ${attempts}/${maxAttempts} with params:`, JSON.stringify(search_params));
        
        // Create a timeout promise to handle fetch timeouts better
        const fetchWithTimeout = async (timeoutMs = 20000) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), timeoutMs);
          
          try {
            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.tavily_api_key}`
              },
              body: JSON.stringify(search_params),
              signal: controller.signal
            });
            clearTimeout(timeout);
            return response;
          } catch (error) {
            clearTimeout(timeout);
            throw error;
          }
        };
        
        // Use our timeout-aware fetch
        const response = await fetchWithTimeout();
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Failed to read error response');
          console.error(`Tavily API error (${response.status}):`, errorText);
          
          // If we hit a rate limit or server error, retry after a delay
          if (response.status === 429 || response.status >= 500) {
            if (attempts < maxAttempts) {
              console.log(`Retrying Tavily API after error (${response.status}) - attempt ${attempts}`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay before retry
              continue;
            }
          }
          
          throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
        }
        
        const resultsData = await response.json();
        console.log(`Tavily search returned ${resultsData.results.length} results`);
        
        return {
          results: resultsData.results,
          query,
          answer: resultsData.answer,
          focusArea: area_filter || undefined,
          response_time: resultsData.response_time
        };
      } catch (error) {
        console.error(`Error searching with Tavily (attempt ${attempts}/${maxAttempts}):`, error);
        
        // Only retry if we haven't reached max attempts
        if (attempts < maxAttempts) {
          console.log(`Retrying Tavily API request - attempt ${attempts + 1}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay before retry
        } else {
          throw error;
        }
      }
    }
    
    // This should never happen due to the throw in the catch block
    // but TypeScript requires a return statement
    throw new Error("Failed to get search results after multiple attempts");
  }
  
  async generate_summary(
    search_results: TavilySearchResults, 
    summary_instructions: string,
    signal?: AbortSignal
  ): Promise<string> {
    console.log('Generating summary with DeepSeek based on search results');
    
    // Format the context for DeepSeek
    const context = search_results.results.map(result => 
      `Title: ${result.title}\nURL: ${result.url}\nContent: ${result.content}`
    ).join('\n\n');
    
    // If Tavily provided an answer, include it
    const tavilyAnswer = search_results.answer ? 
      `\nTavily Summary: ${search_results.answer}\n` : '';
    
    // Format reference links for the summary
    const referenceLinks = search_results.results.map(result => 
      `[${result.title}](${result.url})`
    ).join('\n');
    
    // Create the prompt for DeepSeek - reduce the size to help prevent timeouts
    const prompt = `
You are a senior change management expert creating a summary about "${search_results.query}" in the context of ${search_results.focusArea || 'change management'}.

Analyze these search results:
${tavilyAnswer}
${context}

${summary_instructions}

Remember:
1. Create a concise title that MUST explicitly mention both "${search_results.query}" and "${search_results.focusArea || 'change management'}"
2. Each insight should start with "•" and be actionable for ${search_results.focusArea || 'change management'} professionals
3. Every insight must specifically relate to ${search_results.focusArea || 'change management'} - do not include generic points
4. Write in professional UK English
5. Include references to sources
`;
    
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`DeepSeek API attempt ${attempts}/${maxAttempts}`);
        
        // Create a timeout promise to handle fetch timeouts better
        const fetchWithTimeout = async (timeoutMs = 30000) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), timeoutMs);
          
          // Create a system message to control the output format - shorter for performance
          const systemMessage = `You are a change management expert. Create a summary with:
1. A title that explicitly mentions both "${search_results.query}" and "${search_results.focusArea || 'change management'}"
2. Bulleted insights (using •) that are specifically relevant to ${search_results.focusArea || 'change management'}
3. References to sources`;
          
          try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.deepseek_api_key}`
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                  {
                    role: 'system',
                    content: systemMessage
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
                temperature: 0.2,
                max_tokens: 1500  // Reduced token count to speed up generation
              }),
              signal: controller.signal
            });
            clearTimeout(timeout);
            return response;
          } catch (error) {
            clearTimeout(timeout);
            throw error;
          }
        };
        
        // Use our timeout-aware fetch
        const response = await fetchWithTimeout();
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Failed to read error response');
          console.error(`DeepSeek API error (${response.status}):`, errorText);
          
          // If we hit a rate limit or server error, retry after a delay
          if (response.status === 429 || response.status >= 500) {
            if (attempts < maxAttempts) {
              console.log(`Retrying DeepSeek API after error (${response.status}) - attempt ${attempts}`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay before retry
              continue;
            }
          }
          
          throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        let summaryContent = data.choices[0].message.content;
        
        // If no "References" section exists, add one with the links
        if (!summaryContent.includes('## References')) {
          summaryContent += `\n\n## References\n${referenceLinks}`;
        }
        
        return summaryContent;
      } catch (error) {
        console.error(`Error generating summary with DeepSeek (attempt ${attempts}/${maxAttempts}):`, error);
        
        // Only retry if we haven't reached max attempts
        if (attempts < maxAttempts) {
          console.log(`Retrying DeepSeek API request - attempt ${attempts + 1}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay before retry
        } else {
          // If all DeepSeek attempts fail, generate a simple fallback summary using Tavily data
          console.log('All DeepSeek attempts failed. Generating fallback summary from Tavily data.');
          return this.generateFallbackSummary(search_results);
        }
      }
    }
    
    // This will only execute if we've exhausted all retry attempts
    // and didn't hit the fallback (which should never happen)
    return this.generateFallbackSummary(search_results);
  }
  
  // Generate a fallback summary using only Tavily data when DeepSeek fails
  private generateFallbackSummary(search_results: TavilySearchResults): string {
    try {
      const focusArea = search_results.focusArea || 'Change Management';
      const title = `# ${search_results.query} in ${focusArea}: Key Insights`;
      
      // Use Tavily's answer if available, otherwise create basic insights
      const insightsSection = search_results.answer 
        ? `\n\n## Insights\n• ${search_results.answer.split('. ').join('\n• ')}`
        : `\n\n## Insights in ${focusArea}\n• ${focusArea} requires thorough planning and stakeholder engagement when implementing ${search_results.query} to ensure successful implementation.\n• Clear communication about ${search_results.query} is essential throughout the ${focusArea.toLowerCase()} process to maintain transparency and build trust.\n• Resistance to changes related to ${search_results.query} should be anticipated and addressed proactively to increase acceptance.\n• Leadership support significantly improves the likelihood of successful ${search_results.query} initiatives in ${focusArea.toLowerCase()}.\n• Regular monitoring and measurement helps track progress of ${search_results.query} implementations and demonstrate value.`;
      
      // Add references to all sources
      const referencesSection = `\n\n## References\n${search_results.results.map(result => 
        `[${result.title}](${result.url})`
      ).join('\n')}`;
      
      return `${title}${insightsSection}${referencesSection}`;
    } catch (error) {
      console.error('Error generating fallback summary:', error);
      
      // Ultra simple fallback if even that fails
      return `# ${search_results.query} in Change Management\n\n## Insights\n• Change management is a structured approach to transitioning individuals, teams, and organizations from a current state to a desired future state when implementing ${search_results.query}.\n\n## References\n[Search results available but summary generation failed]`;
    }
  }
  
  async search_and_summarize(
    query: string, 
    area_filter: string | null = null, 
    summary_instructions: string = "",
    signal?: AbortSignal
  ): Promise<{ summary: string; results: TavilySearchResult[] }> {
    console.log('Performing search and summarize operation');
    
    try {
      // First, perform the search
      const search_results = await this.search(query, area_filter, 5, signal);
      
      // Then, generate a summary
      const summary = await this.generate_summary(search_results, summary_instructions, signal);
      
      return {
        summary,
        results: search_results.results
      };
    } catch (error) {
      console.error('Error in search_and_summarize:', error);
      throw error;
    }
  }
} 