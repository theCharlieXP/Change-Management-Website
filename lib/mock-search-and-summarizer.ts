/**
 * MockSearchAndSummarizer - Mock implementation for testing
 * Version 1.0.0
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

export class MockSearchAndSummarizer {
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
    console.log(`MOCK: Performing Tavily search for: "${query}" with focus area: ${area_filter || 'none'}`);
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if the signal is aborted
    if (signal?.aborted) {
      throw new Error('Search operation was aborted');
    }
    
    // Generate mock search results
    const mockResults: TavilySearchResult[] = [
      {
        title: 'Mock Search Result 1',
        url: 'https://example.com/result1',
        content: `This is a mock search result about ${query}. It contains information relevant to ${area_filter || 'general topics'}. There are many aspects to consider when dealing with change management, including stakeholder engagement, communication strategies, and measuring success.`,
        score: 0.95
      },
      {
        title: 'Mock Search Result 2',
        url: 'https://example.com/result2',
        content: `Another mock result for ${query}. Change management requires careful planning and execution. Organizations must prepare for resistance and have strategies to address concerns. Leadership buy-in is essential for success.`,
        score: 0.85
      },
      {
        title: 'Mock Search Result 3',
        url: 'https://example.com/result3',
        content: `A third result about ${query}. Effective change management frameworks include Kotter's 8-Step Process, ADKAR, and Lewin's Change Management Model. Each offers different approaches to managing organizational transitions.`,
        score: 0.75
      }
    ];
    
    return {
      results: mockResults.slice(0, max_results),
      query,
      answer: `Mock Tavily answer about ${query} related to ${area_filter || 'general change management'}. This would typically be a concise summary of the search results, highlighting key points about change management strategies, challenges, and best practices.`,
      focusArea: area_filter || undefined,
      response_time: '0.5'
    };
  }
  
  async generate_summary(
    search_results: TavilySearchResults, 
    summary_instructions: string,
    signal?: AbortSignal
  ): Promise<string> {
    console.log('MOCK: Generating summary based on search results');
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if the signal is aborted
    if (signal?.aborted) {
      throw new Error('Summary generation was aborted');
    }
    
    // Generate a mock summary
    return `# Change Management Insights For ${search_results.query}

## Insights
• Change management requires thorough planning and stakeholder engagement to ensure successful implementation of organizational changes.
• Clear communication strategies are essential throughout the change process to maintain transparency and build trust with employees.
• Resistance to change is natural and should be anticipated; having mechanisms to address concerns is critical for success.
• Leadership buy-in and visible support from executives significantly increases the chance of change initiative success.
• Measuring the effectiveness of change initiatives through defined metrics helps track progress and demonstrate value.
• Different change management frameworks offer various approaches to structuring change processes, each with their own strengths.
• Training and support resources must be available to help employees adapt to new processes or systems.
• Cultural factors play a significant role in how change is received within an organization and should be considered during planning.

## References
[Mock Search Result 1](https://example.com/result1)
[Mock Search Result 2](https://example.com/result2)
[Mock Search Result 3](https://example.com/result3)`;
  }
  
  async search_and_summarize(
    query: string, 
    area_filter: string | null = null, 
    summary_instructions: string = "",
    signal?: AbortSignal
  ): Promise<{ summary: string; results: TavilySearchResult[] }> {
    console.log('MOCK: Performing search and summarize operation');
    
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
      console.error('MOCK: Error in search_and_summarize:', error);
      throw error;
    }
  }
} 