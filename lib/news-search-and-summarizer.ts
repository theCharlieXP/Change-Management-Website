/**
 * NewsSearchAndSummarizer - Class for handling Tavily search and DeepSeek summary generation
 * Version 1.0.0
 */

import { InsightFocusArea } from '@/types/insights';

// Tavily result interfaces
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  keywords?: string[];
}

interface TavilySearchResults {
  results: TavilySearchResult[];
  query: string;
  focusArea?: string;
}

export class NewsSearchAndSummarizer {
  private tavily_api_key: string;
  private deepseek_api_key: string;
  
  constructor(tavily_api_key: string, deepseek_api_key: string) {
    this.tavily_api_key = tavily_api_key;
    this.deepseek_api_key = deepseek_api_key;
  }
  
  async search(query: string, area_filter: string | null = null, max_results: number = 5): Promise<TavilySearchResults> {
    console.log(`Performing Tavily search for: "${query}" with focus area: ${area_filter || 'none'}`);
    
    const search_params = {
      query: query,
      max_results: max_results,
      include_answer: false,
      include_raw_content: true
    };
    
    if (area_filter) {
      // @ts-ignore - Add topic parameter if area_filter is provided
      search_params.topic = area_filter;
    }
    
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tavily_api_key}`
        },
        body: JSON.stringify(search_params)
      });
      
      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }
      
      const results = await response.json();
      console.log(`Tavily search returned ${results.results.length} results`);
      
      return {
        results: results.results,
        query,
        focusArea: area_filter || undefined
      };
    } catch (error) {
      console.error('Error searching with Tavily:', error);
      throw error;
    }
  }
  
  async generate_summary(search_results: TavilySearchResults, summary_instructions: string): Promise<string> {
    console.log('Generating summary with DeepSeek based on search results');
    
    const context = search_results.results.map(result => 
      `Title: ${result.title}\nURL: ${result.url}\nContent: ${result.content}`
    ).join('\n\n');
    
    const prompt = `
Based on the following search results and your knowledge, create a summary.

Search Results:
${context}

${summary_instructions ? `Instructions for summary:
${summary_instructions}

` : ''}Summary:
`;
    
    try {
      console.log('Sending prompt to DeepSeek for summary generation');
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
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2500
        })
      });
      
      if (!response.ok) {
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
    summary_instructions: string = ""
  ): Promise<{ summary: string; results: TavilySearchResult[] }> {
    console.log('Performing search and summarize operation');
    
    try {
      // First, perform the search
      const search_results = await this.search(query, area_filter);
      
      // Then, generate a summary
      const summary = await this.generate_summary(search_results, summary_instructions);
      
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