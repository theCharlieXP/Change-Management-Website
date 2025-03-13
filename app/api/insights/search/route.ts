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
    
    // Don't add additional keywords if the query is already specific
    // This avoids over-filtering when the user has already provided a good query
    if (query.length < 15) {
      // Only add the first keyword for short queries to provide some context
      queryParts.push(focusAreaInfo.keywords[0])
    }
  } else {
    // If no specific query, use the focus area keywords to help
    // Only use the first 2 keywords to keep it focused
    queryParts.push(focusAreaInfo.keywords.slice(0, 2).join(' '))
  }
  
  // Add industries if specified (but keep it simple)
  if (industries?.length) {
    // Only add the first industry to avoid over-filtering
    queryParts.push(industries[0])
  }

  // Add "change management" as a context term only if the query doesn't already contain it
  if (!query.toLowerCase().includes('change management')) {
    queryParts.push("change management")
  }

  // Combine with simple spaces - no special weighting or complex combinations
  const searchQuery = queryParts.join(' ')
  console.log('Constructed search query:', searchQuery)

  const searchParams = {
    query: searchQuery,
    search_depth: "basic",
    include_answer: true,
    max_results: 15,
    search_type: "keyword",
    // Include more domains since the user is already providing specific queries
    include_domains: [
      'hbr.org', 'mckinsey.com', 'bcg.com',
      'deloitte.com', 'pwc.com', 'accenture.com',
      'gartner.com', 'forrester.com'
    ],
    exclude_domains: [
      'youtube.com', 'facebook.com', 'twitter.com',
      'instagram.com', 'linkedin.com'
    ],
    // Increase search timeout since the user is providing specific queries
    search_timeout: 45 // seconds - increased for more thorough search with specific queries
  }

  try {
    console.log('Making Tavily API request with params:', JSON.stringify(searchParams, null, 2))
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // Increased from 50s to 55s timeout for the Tavily API request
    
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
    // First, generate a title
    const titleResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
            content: 'Create a clear, specific title (5-10 words) that captures the focus of this research. Use title case, without any punctuation, quotes, or special characters.'
          },
          {
            role: 'user',
            content: `Search Query: ${searchQuery}\nFocus Area: ${focusAreaInfo.label}\n\nFirst paragraph of content:\n${content.split('\n')[0]}`
          }
        ],
        temperature: 0.2,
        max_tokens: 50
      })
    })

    const titleData = await titleResponse.json()
    const generatedTitle = titleData.choices[0].message.content.trim()

    // Then generate the summary with either normal or creative mode
    const systemPrompt = useCreativeMode ? 
      `You are an expert in change management and organizational transformation. Create a comprehensive analysis focused on ${focusAreaInfo.label} (${focusAreaInfo.description}). 

Use British English spelling and grammar.

Format the response with these exact section headings (without any special characters or numbers):

Context

Key Findings

Patterns

Implications

Follow-up Questions

For the Context section:
- List the search query and filters used
- Format as "Search Query: [query]"
- List any industries specified
- Keep it clear and concise

For all other sections:
- Start each point with a bullet point character (•)
- Write in clear, concise business language
- One point per line
- No special characters, asterisks, or markdown
- No numbering
- No quotes
- Start each point with a capital letter
- End each point with a period

For the Implications section specifically:
- Translate the findings into practical implementation guidance
- Focus on how the insights impact change planning and execution
- Provide actionable recommendations
- Connect directly to change management practices

Your analysis should:
- Be specific to ${focusAreaInfo.label}
- Use clear business language
- Combine insights from sources with expert analysis
- Provide actionable takeaways
- Keep points concise but informative` :
      // Original prompt for normal mode
      `You are an expert in change management and organizational transformation. Create a comprehensive analysis focused on ${focusAreaInfo.label} (${focusAreaInfo.description}). 

Use British English spelling and grammar.

While there are limited direct sources available, use your expertise to:
- Analyze the available content thoroughly
- Expand on the key themes with your expert knowledge
- Provide practical insights based on industry best practices
- Draw from your understanding of similar cases and scenarios
- Offer actionable recommendations

Format the response with these exact section headings (without any special characters or numbers):

Context

Key Findings

Patterns

Implications

Follow-up Questions

For the Context section:
- List the search query and filters used
- Format as "Search Query: [query]"
- List any industries specified
- Keep it clear and concise

For all other sections:
- Start each point with a bullet point character (•)
- Write in clear, concise business language
- One point per line
- No special characters, asterisks, or markdown
- No numbering
- No quotes
- Start each point with a capital letter
- End each point with a period

For the Implications section specifically:
- Translate the findings into practical implementation guidance
- Focus on how the insights impact change planning and execution
- Provide actionable recommendations
- Connect directly to change management practices

Your analysis should:
- Be specific to ${focusAreaInfo.label}
- Use clear business language
- Combine limited source insights with expert analysis
- Provide actionable takeaways
- Keep points concise but informative`

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
        temperature: useCreativeMode ? 0.7 : 0.3,
        max_tokens: 1000
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

    // Combine title and summary
    return `${generatedTitle}\n\n${cleanedSummary}`
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
      }, 65000); // Increased from 55s to 65s timeout for the entire request
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
      const resultsToProcess = searchResults.slice(0, 15)
      
      // Process insights in parallel for better performance
      // Split processing into smaller batches to avoid overwhelming the system
      const processBatch = async (batch: SearchResult[]) => {
        return Promise.all(batch.map(async (result) => {
          try {
            // Skip title generation for faster processing
            const title = result.title
            
            // Create the insight
            return {
              id: crypto.randomUUID(),
              title: title,
              content: result.content,
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
        // Process in batches of 5 for better performance
        const batchSize = 5
        const batches = []
        
        for (let i = 0; i < resultsToProcess.length; i += batchSize) {
          batches.push(resultsToProcess.slice(i, i + batchSize))
        }
        
        // Set a timeout for the parallel processing
        const processingTimeout = new Promise<(Insight | null)[]>((resolve) => {
          setTimeout(() => {
            // If processing takes too long, return a fallback with basic insights
            console.log('Insight processing timed out, using fallback')
            resolve(resultsToProcess.slice(0, 8).map(result => {
              // Use a simple string conversion approach to avoid type issues
              const contentStr = typeof result.content === 'string' 
                ? result.content 
                : JSON.stringify(result.content);
              
              return {
                id: crypto.randomUUID(),
                title: result.title,
                content: contentStr.substring(0, 1000),
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
        processedInsights = resultsToProcess.slice(0, 8).map(result => {
          // Use a simple string conversion approach to avoid type issues
          const contentStr = typeof result.content === 'string' 
            ? result.content 
            : JSON.stringify(result.content);
          
          return {
            id: crypto.randomUUID(),
            title: result.title,
            content: contentStr.substring(0, 1000),
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
          // Select a representative sample of insights for summarization
          // Take first 3, middle 2, and last 3 for a better representation
          const insightsForSummary = []
          
          if (validInsights.length <= 8) {
            // If we have 8 or fewer insights, use all of them
            insightsForSummary.push(...validInsights)
          } else {
            // Take first 3
            insightsForSummary.push(...validInsights.slice(0, 3))
            
            // Take middle 2
            const middleIndex = Math.floor(validInsights.length / 2)
            insightsForSummary.push(...validInsights.slice(middleIndex - 1, middleIndex + 1))
            
            // Take last 3
            insightsForSummary.push(...validInsights.slice(-3))
          }
          
          // Combine content from selected insights for faster summarization
          const combinedContent = insightsForSummary
            .map(insight => {
              // Use the same string conversion approach
              const contentStr = typeof insight.content === 'string' 
                ? insight.content 
                : JSON.stringify(insight.content);
              // Take first 300 chars to keep it manageable
              return contentStr.substring(0, 300);
            })
            .join('\n\n')
          
          // Generate summary with a timeout
          const summaryPromise = summarizeWithDeepseek(
            combinedContent,
            focusArea,
            query,
            false,
            { query, focusArea, industries }
          )
          
          // Set a timeout for summary generation
          const summaryTimeout = new Promise<string>((resolve) => {
            setTimeout(() => {
              // If summarization takes too long, return a basic summary
              resolve(`${INSIGHT_FOCUS_AREAS[focusArea].label} Insights\n\nContext\nSearch Query: ${query || 'None'}\nFocus Area: ${INSIGHT_FOCUS_AREAS[focusArea].label}\n${industries.length ? `Industries: ${industries.join(', ')}` : ''}\n\nKey Findings\n• Found ${validInsights.length} relevant sources related to ${INSIGHT_FOCUS_AREAS[focusArea].label}.\n• Sources include ${validInsights.slice(0, 3).map(i => i.source).join(', ')}.\n• Review the individual insights for detailed information.`)
            }, 20000) // 20 second timeout for summarization (increased from 15s)
          })
          
          // Race between normal summarization and timeout
          summary = await Promise.race([summaryPromise, summaryTimeout])
        } catch (error) {
          console.error('Error generating summary:', error)
          // Provide a basic summary as fallback
          summary = `${INSIGHT_FOCUS_AREAS[focusArea].label} Insights\n\nContext\nSearch Query: ${query || 'None'}\nFocus Area: ${INSIGHT_FOCUS_AREAS[focusArea].label}\n${industries.length ? `Industries: ${industries.join(', ')}` : ''}\n\nKey Findings\n• Found ${validInsights.length} relevant sources related to ${INSIGHT_FOCUS_AREAS[focusArea].label}.\n• Sources include ${validInsights.slice(0, 3).map(i => i.source).join(', ')}.\n• Review the individual insights for detailed information.`
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
async function getDefaultCategoryId() {
  const category = await prisma.category.findFirst({
    where: { name: 'Digital Transformation' },
  })
  return category?.id
} 