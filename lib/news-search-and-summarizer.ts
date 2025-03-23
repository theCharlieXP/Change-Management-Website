/**
 * NewsSearchAndSummarizer - Class for handling Tavily search and DeepSeek summary generation
 * Version 1.0.2
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
    
    try {
      console.log('Sending request to Tavily API with params:', JSON.stringify(search_params));
      
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tavily_api_key}`
        },
        body: JSON.stringify(search_params),
        signal: signal // Use the AbortSignal if provided
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error(`Tavily API error (${response.status}):`, errorText);
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
      console.error('Error searching with Tavily:', error);
      throw error;
    }
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
    
    // Create the prompt for DeepSeek
    const prompt = `
Based on the following search results about change management, create a comprehensive summary.

${tavilyAnswer}
Search Results:
${context}

${summary_instructions ? `Instructions for summary:
${summary_instructions}

` : ''}Summary:
`;
    
    try {
      console.log('Sending prompt to DeepSeek for summary generation');
      
      // Create a system message to control the output format
      const systemMessage = `You are an expert in change management who provides insightful analysis.
Please analyze the provided content and create a summary according to the user's instructions.
Make sure to follow any formatting instructions precisely.`;
      
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
          temperature: 0.1,
          max_tokens: 2500
        }),
        signal: signal // Use the AbortSignal if provided
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error(`DeepSeek API error (${response.status}):`, errorText);
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating summary with DeepSeek:', error);
      throw error;
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