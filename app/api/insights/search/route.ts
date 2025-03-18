import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InsightFocusArea, Insight } from '@/types/insights'
import { auth } from '@clerk/nextjs/server'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

const INSIGHT_FOCUS_AREAS: Record<InsightFocusArea, { label: string, description: string, keywords: string[] }> = {
  'challenges-barriers': {
    label: 'Challenges & Barriers',
    description: 'Common obstacles and difficulties faced during change initiatives',
    keywords: ['resistance', 'constraints', 'limitations', 'barriers', 'challenges', 'obstacles', 'difficulties']
  },
  'strategies-solutions': {
    label: 'Strategies & Solutions',
    description: 'Effective approaches and solutions for managing change',
    keywords: ['strategy', 'solution', 'approach', 'method', 'practice', 'implementation', 'innovation']
  },
  'outcomes-results': {
    label: 'Outcomes & Results',
    description: 'Measurable impacts and results of change initiatives',
    keywords: ['ROI', 'results', 'outcomes', 'improvements', 'metrics', 'success', 'impact']
  },
  'key-stakeholders-roles': {
    label: 'Key Stakeholders & Roles',
    description: 'Important players and their responsibilities in change management',
    keywords: ['stakeholder', 'role', 'leadership', 'participation', 'involvement', 'responsibility']
  },
  'best-practices-methodologies': {
    label: 'Best Practices & Methodologies',
    description: 'Proven methods and frameworks for successful change',
    keywords: ['best practice', 'methodology', 'framework', 'model', 'process', 'approach']
  },
  'lessons-learned-insights': {
    label: 'Lessons Learned & Insights',
    description: 'Key learnings and insights from change initiatives',
    keywords: ['lesson', 'insight', 'learning', 'takeaway', 'reflection', 'experience']
  },
  'implementation-tactics': {
    label: 'Implementation Tactics',
    description: 'Specific techniques and approaches for implementing change',
    keywords: ['implementation', 'tactic', 'deployment', 'execution', 'rollout', 'adoption']
  },
  'change-readiness': {
    label: 'Change Readiness',
    description: 'Assessing and preparing organizations for change',
    keywords: ['readiness', 'assessment', 'preparation', 'capability', 'capacity', 'evaluation']
  },
  'change-sustainability': {
    label: 'Change Sustainability',
    description: 'Ensuring changes are maintained and embedded in the organization',
    keywords: ['sustainability', 'maintenance', 'embedding', 'reinforcement', 'continuity', 'persistence']
  },
  'communication-engagement': {
    label: 'Communication & Engagement',
    description: 'Effective communication and engagement strategies for change initiatives',
    keywords: ['communication', 'engagement', 'messaging', 'involvement', 'participation', 'dialogue']
  },
  'metrics-performance': {
    label: 'Metrics & Performance',
    description: 'Measuring and evaluating the performance of change initiatives',
    keywords: ['metrics', 'performance', 'measurement', 'evaluation', 'KPI', 'indicators', 'assessment']
  },
  'risk-management': {
    label: 'Risk Management',
    description: 'Managing risks associated with change initiatives',
    keywords: ['risk', 'management', 'mitigation', 'contingency', 'planning', 'assessment', 'analysis']
  },
  'technology-tools': {
    label: 'Technology & Tools',
    description: 'Utilizing technology and tools for change initiatives',
    keywords: ['technology', 'tools', 'software', 'systems', 'digital', 'automation', 'platforms']
  },
  'cultural-transformation': {
    label: 'Cultural Transformation',
    description: 'Transforming organizational culture for change',
    keywords: ['culture', 'transformation', 'values', 'behaviors', 'norms', 'mindset', 'attitudes']
  },
  'change-leadership': {
    label: 'Change Leadership',
    description: 'Leading and inspiring change initiatives',
    keywords: ['leadership', 'inspiration', 'vision', 'direction', 'guidance', 'influence', 'motivation']
  },
  'employee-training': {
    label: 'Employee Training',
    description: 'Training and development of employees for change initiatives',
    keywords: ['training', 'development', 'learning', 'skills', 'education', 'capability', 'competency']
  }
}

interface SearchResult {
  title: string
  content: string
  url: string
  source?: string
  published_date?: string
  description?: string
  relevanceScore?: number
}

async function searchTavily(
  query: string, 
  focusArea: InsightFocusArea,
  industries?: string[],
): Promise<SearchResult[]> {
  if (!TAVILY_API_KEY) {
    console.error('Tavily API key is missing')
    throw new Error('Tavily API key not configured')
  }

  console.log('Starting Tavily search with:', {
    query,
    focusArea,
    industries,
    hasApiKey: !!TAVILY_API_KEY
  })

  // Construct search query - Simplified to improve results
  const queryParts = []
  const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea]
  
  // Start with the main query - make it the primary focus
  if (query) {
    queryParts.push(query)
    
    // Don't add any additional keywords to keep the query as clean as possible
  } else {
    // If no specific query, use only the first keyword to keep it focused
    queryParts.push(focusAreaInfo.keywords[0])
  }
  
  // Add industries if specified (but keep it simple)
  if (industries?.length) {
    // Only add the first industry to avoid over-filtering
    queryParts.push(industries[0])
  }

  // Only add "change management" if absolutely necessary and query is very short
  if (!query.toLowerCase().includes('change management') && queryParts.join(' ').length < 10) {
    queryParts.push("change management")
  }

  // Combine with simple spaces - no special weighting or complex combinations
  const searchQuery = queryParts.join(' ')
  console.log('Constructed search query:', searchQuery)

  const searchParams = {
    query: searchQuery,
    search_depth: "basic",
    include_answer: true,
    max_results: 10, // Increased from 5 to 10 for more comprehensive results
    search_type: "keyword",
    // Include only the most relevant domains
    include_domains: [
      'hbr.org', 'mckinsey.com', 'bcg.com',
      'deloitte.com', 'pwc.com'
    ],
    exclude_domains: [
      'youtube.com', 'facebook.com', 'twitter.com',
      'instagram.com', 'linkedin.com'
    ],
    // Increase search timeout to avoid server-side timeouts
    search_timeout: 30 // seconds - increased from 20s to 30s
  }

  try {
    console.log('Making Tavily API request with params:', JSON.stringify(searchParams, null, 2))
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000); // Increased from 25s to 40s timeout for the Tavily API request
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify(searchParams),
      cache: 'no-store',
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    console.log('Tavily API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tavily API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Tavily API error: ${errorText}`)
    }

    const data = await response.json()
    console.log('Tavily API response:', {
      hasResults: !!data.results,
      resultCount: data.results?.length || 0,
      firstResult: data.results?.[0] ? {
        hasTitle: !!data.results[0].title,
        hasContent: !!data.results[0].content,
        url: data.results[0].url
      } : null
    })

    if (!Array.isArray(data.results)) {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format from Tavily API')
    }

    // Simplify the scoring and filtering of results
    const scoredResults = data.results
      .filter((result: SearchResult) => {
        // Only filter out empty content
        return result.content && result.content.length > 0
      })

    console.log('Search results processed:', {
      originalCount: data.results.length,
      filteredCount: scoredResults.length,
      sampleUrls: scoredResults.slice(0, 3).map((r: SearchResult) => r.url)
    })

    return scoredResults
  } catch (error: unknown) {
    console.error('Error in Tavily search:', error)
    // Check if it's an AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Search request timed out. Please try again with a more specific query.')
    }
    throw error
  }
}

async function generateTitle(content: string, originalTitle: string): Promise<string> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  if (!DEEPSEEK_API_KEY) return originalTitle.replace(/["']/g, '')

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
            content: 'Create a clear, concise (5-10 words) title in title case that captures the main business insight. No punctuation or quotes.'
          },
          {
            role: 'user',
            content: `Original Title: ${originalTitle}\n\nContent:\n${content.substring(0, 1000)}`
          }
        ],
        temperature: 0.2,
        max_tokens: 50
      })
    })

    if (!response.ok) throw new Error('Failed to generate title')
    const data = await response.json()
    return data.choices[0].message.content.trim().replace(/["']/g, '')
  } catch (error) {
    console.error('Title generation error:', error)
    return originalTitle.replace(/["']/g, '')
  }
}

async function summarizeWithDeepseek(
  content: string, 
  focusArea: InsightFocusArea, 
  searchQuery: string,
  useCreativeMode: boolean = false,
  searchContext: {
    query: string,
    focusArea: InsightFocusArea,
    industries: string[],
  }
): Promise<string> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  if (!DEEPSEEK_API_KEY) return content

  const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea]
  
  // Format the context information
  const contextInfo = `Search Information:
Query: ${searchContext.query}
Focus Area: ${focusAreaInfo.label}
${searchContext.industries.length ? `Industries: ${searchContext.industries.join(', ')}` : ''}`

  try {
    // Generate a clean title that summarizes the insight search
    const generatedTitle = `${focusAreaInfo.label} Insights: ${searchQuery}`

    // Updated system prompt for UK English and proper formatting with the exact requested sections
    const systemPrompt = `You are an expert in change management focusing on ${focusAreaInfo.label}.
Create a concise analysis using UK English spelling and grammar with these EXACT sections in this order:

Title (a clear, descriptive title that captures the main theme or key finding)
Context
Summary of Results
Key Findings
Patterns
Follow-up Questions (to help with learning more)
References (with links)

For the Title:
- Generate a concise, descriptive title that captures the main theme
- Do not include "Title:" prefix
- Make it specific to the search results

For the Context section:
- Include the search query and focus area
- Keep it brief and clean
- Use UK English spelling (organisation, not organization; programme, not program; etc.)

For Summary of Results, Key Findings, and Patterns sections:
- Use bullet points (•)
- Be concise and specific
- Focus only on ${focusAreaInfo.label}
- Provide actionable insights
- Use UK English spelling

For Follow-up Questions:
- Suggest 3-5 specific questions that would help deepen understanding
- Make questions specific and directly related to the insights
- Format as bullet points (•)

For References:
- Include the EXACT source name and FULL URL for each reference
- Format as bullet points (•)
- Include all of the most relevant sources
- Format EXACTLY as: • [Source Name] - https://www.exacturl.com/page
- Do not abbreviate or modify the URLs in any way
- Make sure each URL is complete and starts with http:// or https://
- Keep the exact domain and path of each URL

IMPORTANT: Format each section with the heading on its own line, followed by bullet points. Do not add any additional sections or change the order.`

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
            content: `${contextInfo}\n\n${content}`
          }
        ],
        temperature: 0.3, // Lower temperature for faster, deterministic results
        max_tokens: 1000 // Increased from 800 to 1000 for more comprehensive summaries
      })
    })

    if (!response.ok) throw new Error(`Deepseek API error: ${await response.text()}`)
    const data = await response.json()
    const summary = data.choices[0].message.content

    // Clean up any remaining special characters and ensure proper spacing
    const cleanedSummary = summary
      .replace(/[#*"`]/g, '')  // Remove any remaining special characters
      .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newlines
      .trim()

    // Return the summary without adding a title prefix - the title is already the first line
    return cleanedSummary
  } catch (error) {
    console.error('Summarization error:', error)
    return content
  }
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const focusArea = searchParams.get('focusArea') as InsightFocusArea
  const industriesParam = searchParams.get('industries')
  const industries = industriesParam ? industriesParam.split(',') : []
  
  // Validate required parameters
  if (!focusArea || !Object.keys(INSIGHT_FOCUS_AREAS).includes(focusArea)) {
    return NextResponse.json(
      { error: 'Invalid or missing focus area' },
      { status: 400 }
    )
  }

  console.log('Search request received:', { query, focusArea, industries })
  
  try {
    // Set a timeout for the entire request processing
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request processing timed out'));
      }, 50000); // Increased from 30s to 50s timeout for the entire request
    });

    // Create the main processing promise
    const processingPromise = (async (): Promise<Response> => {
      // Search for relevant content
      let searchResults: SearchResult[] = []
      
      try {
        searchResults = await searchTavily(query, focusArea, industries)
      } catch (error: unknown) {
        console.error('Error in search:', error)
        // If Tavily search fails, return a specific error
        if (error instanceof Error) {
          if (error.message.includes('timed out')) {
            return NextResponse.json(
              { 
                error: 'Search timed out. Please try a more specific query, fewer industries, or a different focus area.',
                details: error.message
              },
              { status: 504 }
            )
          }
          
          return NextResponse.json(
            { 
              error: 'Search service error',
              details: error.message
            },
            { status: 500 }
          )
        }
      }
      
      if (searchResults.length === 0) {
        return NextResponse.json(
          { 
            results: [],
            summary: null,
            message: 'No results found. Try adjusting your search criteria.'
          },
          { status: 200 }
        )
      }
      
      // Process the results to create insights - process more results since the user is providing specific queries
      const resultsToProcess = searchResults.slice(0, 10) // Increased from 3 to 10 to process all results
      
      // Process insights in parallel for better performance
      // Split processing into smaller batches to avoid overwhelming the system
      const processBatch = async (batch: SearchResult[]) => {
        return Promise.all(batch.map(async (result) => {
          try {
            // Create the insight with minimal processing - no title generation or other heavy processing
            return {
              id: crypto.randomUUID(),
              title: result.title,
              content: typeof result.content === 'string' ? result.content.substring(0, 500) : JSON.stringify(result.content).substring(0, 500),
              focus_area: focusArea,
              source: result.source || new URL(result.url).hostname.replace('www.', ''),
              url: result.url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              summary: '',
              tags: industries,
              readTime: '3 min',
              category: INSIGHT_FOCUS_AREAS[focusArea].label
            } as Insight
          } catch (error) {
            console.error('Error processing search result:', error)
            return null
          }
        }))
      }
      
      // Wait for all insight processing to complete with a timeout
      let processedInsights: (Insight | null)[] = []
      try {
        // Process in batches of 3 for better performance
        const batchSize = 3
        const batches = []
        
        for (let i = 0; i < resultsToProcess.length; i += batchSize) {
          batches.push(resultsToProcess.slice(i, i + batchSize))
        }
        
        // Set a timeout for the parallel processing
        const processingTimeout = new Promise<(Insight | null)[]>((resolve) => {
          setTimeout(() => {
            // If processing takes too long, return a fallback with basic insights
            console.log('Insight processing timed out, using fallback')
            resolve(resultsToProcess.slice(0, 2).map(result => { // Reduced from 3 to 2
              // Use a simple string conversion approach to avoid type issues
              const contentStr = typeof result.content === 'string' 
                ? result.content 
                : JSON.stringify(result.content);
              
              return {
                id: crypto.randomUUID(),
                title: result.title,
                content: contentStr.substring(0, 300), // Reduced from 500 to 300
                focus_area: focusArea,
                source: result.source || new URL(result.url).hostname.replace('www.', ''),
                url: result.url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                summary: '',
                tags: industries,
                readTime: '3 min',
                category: INSIGHT_FOCUS_AREAS[focusArea].label
              };
            }))
          }, 15000) // 15 second timeout for processing (increased from 10s)
        })
        
        // Process batches sequentially to avoid overwhelming the system
        const batchResults = []
        for (const batch of batches) {
          const batchResult = await processBatch(batch)
          batchResults.push(...batchResult)
          
          // Small delay between batches to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Race between normal processing and timeout
        processedInsights = await Promise.race([
          Promise.resolve(batchResults),
          processingTimeout
        ])
      } catch (error) {
        console.error('Error in parallel processing:', error)
        // Fallback to basic processing if parallel fails
        processedInsights = resultsToProcess.slice(0, 2).map(result => { // Reduced from 3 to 2
          // Use a simple string conversion approach to avoid type issues
          const contentStr = typeof result.content === 'string' 
            ? result.content 
            : JSON.stringify(result.content);
          
          return {
            id: crypto.randomUUID(),
            title: result.title,
            content: contentStr.substring(0, 300), // Reduced from 500 to 300
            focus_area: focusArea,
            source: result.source || new URL(result.url).hostname.replace('www.', ''),
            url: result.url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            summary: '',
            tags: industries,
            readTime: '3 min',
            category: INSIGHT_FOCUS_AREAS[focusArea].label
          };
        })
      }
      
      // Filter out any null results from failed processing
      const validInsights = processedInsights.filter(insight => insight !== null) as Insight[]
      
      // Generate a summary if we have insights
      let summary = null
      if (validInsights.length > 0) {
        try {
          // For summarization, use more insights now that we're processing more results
          const insightsForSummary = validInsights.slice(0, 5) // Increased from 2 to 5
          
          // Combine content from selected insights
          const combinedContent = insightsForSummary
            .map(insight => {
              // Use the same string conversion approach
              const contentStr = typeof insight.content === 'string' 
                ? insight.content 
                : JSON.stringify(insight.content);
              // Take first 500 chars to include more content
              return contentStr.substring(0, 500);
            })
            .join('\n\n')
          
          // Generate summary with a timeout
          const summaryPromise = summarizeWithDeepseek(
            combinedContent,
            focusArea,
            query,
            false, // Use standard mode
            { query, focusArea, industries }
          )
          
          // Set a timeout for summary generation
          const summaryTimeout = new Promise<string>((resolve) => {
            setTimeout(() => {
              // If summarization takes too long, return a basic summary with the requested format
              // Create nicely formatted references with exact URLs
              const formattedReferences = validInsights.slice(0, 5).map(insight => {
                // Format reference with fallbacks for missing values
                const sourceText = insight.source || 'Source';
                const urlText = insight.url || '#';
                return `• ${sourceText} - ${urlText}`;
              }).join('\n');
              
              const fallbackSummary = `${INSIGHT_FOCUS_AREAS[focusArea].label} Insights: ${query || 'General Search'}

Context
• Search Query: ${query || 'None'}
• Focus Area: ${INSIGHT_FOCUS_AREAS[focusArea].label}
${industries.length ? `• Industries: ${industries.join(', ')}` : ''}

Summary of Results
• Found ${validInsights.length} relevant sources related to ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Sources include ${validInsights.slice(0, 3).map(i => i.source || 'Unknown Source').join(', ')}.
• Review the individual insights for detailed information.

Key Findings
• The search returned multiple perspectives on ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Each source provides unique insights into this focus area.
• Consider reviewing each source for more detailed information.

Patterns
• Multiple sources address aspects of ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Common themes may emerge upon closer examination of each source.
• Industry-specific patterns may be present in the individual insights.

Follow-up Questions (to help with learning more)
• What specific strategies have been most effective for ${INSIGHT_FOCUS_AREAS[focusArea].label}?
• How do different industries approach ${INSIGHT_FOCUS_AREAS[focusArea].label} differently?
• What metrics are commonly used to measure success in ${INSIGHT_FOCUS_AREAS[focusArea].label}?

References (with links)
${formattedReferences}`;
              resolve(fallbackSummary);
            }, 30000); // Increased from 20000 to 30000 ms for processing more sources
          })
          
          // Race between normal summarization and timeout
          summary = await Promise.race([summaryPromise, summaryTimeout])
        } catch (error) {
          console.error('Error generating summary:', error)
          // Provide a basic summary as fallback with the requested format
          
          // Create nicely formatted references with exact URLs
          const errorFormattedReferences = validInsights.slice(0, 5).map(insight => {
            // Format reference with fallbacks for missing values
            const sourceText = insight.source || 'Source';
            const urlText = insight.url || '#';
            return `• ${sourceText} - ${urlText}`;
          }).join('\n');
          
          const errorFallbackSummary = `${INSIGHT_FOCUS_AREAS[focusArea].label} Insights: ${query || 'General Search'}

Context
• Search Query: ${query || 'None'}
• Focus Area: ${INSIGHT_FOCUS_AREAS[focusArea].label}
${industries.length ? `• Industries: ${industries.join(', ')}` : ''}

Summary of Results
• Found ${validInsights.length} relevant sources related to ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Sources include ${validInsights.slice(0, 3).map(i => i.source || 'Unknown Source').join(', ')}.
• Review the individual insights for detailed information.

Key Findings
• The search returned multiple perspectives on ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Each source provides unique insights into this focus area.
• Consider reviewing each source for more detailed information.

Patterns
• Multiple sources address aspects of ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Common themes may emerge upon closer examination of each source.
• Industry-specific patterns may be present in the individual insights.

Follow-up Questions (to help with learning more)
• What specific strategies have been most effective for ${INSIGHT_FOCUS_AREAS[focusArea].label}?
• How do different industries approach ${INSIGHT_FOCUS_AREAS[focusArea].label} differently?
• What metrics are commonly used to measure success in ${INSIGHT_FOCUS_AREAS[focusArea].label}?

References (with links)
${errorFormattedReferences}`;
          summary = errorFallbackSummary;
        }
      }
      
      return NextResponse.json({
        results: validInsights,
        summary
      })
    })();

    // Race between the processing and the timeout
    return await Promise.race([processingPromise, timeoutPromise]);
  } catch (error: unknown) {
    console.error('Error processing search request:', error)
    
    // Handle timeout specifically
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { 
          error: 'Request timed out. Please try a more specific query, fewer industries, or a different focus area.',
          details: error.message
        },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'An error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to get default category ID
async function getDefaultCategoryId(): Promise<string | undefined> {
  const category = await prisma.category.findFirst({
    where: { name: 'Digital Transformation' },
  })
  return category?.id
}