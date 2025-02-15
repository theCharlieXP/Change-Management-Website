import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InsightFocusArea } from '@/types/insights'
import { auth } from '@clerk/nextjs'

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
    description: 'Ensuring long-term change, embedding change into organizational processes',
    keywords: ['sustainability', 'long-term', 'embedding', 'sustaining', 'maintaining', 'reinforcing']
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
  timeframe?: string
): Promise<SearchResult[]> {
  if (!TAVILY_API_KEY) {
    console.error('Tavily API key is missing')
    throw new Error('Tavily API key not configured')
  }

  console.log('Starting Tavily search with:', {
    query,
    focusArea,
    industries,
    timeframe,
    hasApiKey: !!TAVILY_API_KEY
  })

  // Handle time ranges
  let time_range: string | undefined
  switch (timeframe) {
    case 'last_day': time_range = 'day'; break
    case 'last_week': time_range = 'week'; break
    case 'last_month': time_range = 'month'; break
    case 'last_year': time_range = 'year'; break
    default: time_range = undefined
  }

  // Construct search query - Simplified to improve results
  const queryParts = []
  const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea]
  
  // Start with the main query
  if (query) {
    queryParts.push(query)
  }
  
  // Add focus area as a single term
  queryParts.push(focusAreaInfo.label)
  
  // Add industries if specified (but keep it simple)
  if (industries?.length) {
    // Only add the first industry to avoid over-filtering
    queryParts.push(industries[0])
  }

  // Combine with simple spaces - no special weighting or complex combinations
  const searchQuery = queryParts.join(' ')
  console.log('Constructed search query:', searchQuery)

  const searchParams = {
    query: searchQuery,
    search_depth: "advanced",
    include_answer: true,
    max_results: 20, // Reduced from 40 to get more focused results
    search_type: "keyword", // Changed from semantic to keyword for broader matches
    include_domains: [
      // Prioritize most relevant sources but keep the list shorter
      'hbr.org', 'mckinsey.com', 'bcg.com',
      'deloitte.com', 'pwc.com', 'accenture.com',
      'gartner.com', 'forrester.com',
      'researchgate.net', 'academia.edu'
    ],
    exclude_domains: [
      'youtube.com', 'facebook.com', 'twitter.com',
      'instagram.com', 'linkedin.com', 'pinterest.com',
      'reddit.com'
    ],
    ...(time_range && { time_range })
  }

  try {
    console.log('Making Tavily API request with params:', JSON.stringify(searchParams, null, 2))
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify(searchParams),
      cache: 'no-store'
    })

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
      .slice(0, 10) // Take top 10 results from Tavily's ranking

    console.log('Search results processed:', {
      originalCount: data.results.length,
      filteredCount: scoredResults.length,
      sampleUrls: scoredResults.slice(0, 3).map((r: SearchResult) => r.url)
    })

    return scoredResults
  } catch (error) {
    console.error('Error in Tavily search:', error)
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
    timeframe?: string
  }
): Promise<string> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  if (!DEEPSEEK_API_KEY) return content

  const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea]
  
  // Format the context information
  const contextInfo = `Search Information:
Query: ${searchContext.query}
Focus Area: ${focusAreaInfo.label}
${searchContext.industries.length ? `Industries: ${searchContext.industries.join(', ')}` : ''}
${searchContext.timeframe ? `Time Range: ${searchContext.timeframe.replace('_', ' ')}` : ''}`

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
- List the time range if specified
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
- List the time range if specified
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

export async function GET(request: Request) {
  try {
    console.log('Starting search request...')
    const { userId } = auth()
    
    // Check authentication
    if (!userId) {
      console.log('No user ID found')
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: 'Authentication required'
        }),
        { status: 401 }
      )
    }

    // Validate API keys
    const missingKeys = []
    if (!TAVILY_API_KEY) missingKeys.push('TAVILY_API_KEY')
    if (!process.env.DEEPSEEK_API_KEY) missingKeys.push('DEEPSEEK_API_KEY')
    
    if (missingKeys.length > 0) {
      console.error('Missing API keys:', missingKeys)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Configuration Error',
          details: `Missing required API keys: ${missingKeys.join(', ')}`
        }),
        { status: 503 }
      )
    }

    // Parse and validate search parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const focusArea = searchParams.get('focusArea') as InsightFocusArea
    const industries = searchParams.get('industries')?.split(',').filter(Boolean)
    const timeframe = searchParams.get('timeframe') || undefined

    console.log('Search parameters received:', {
      query,
      focusArea,
      industries,
      timeframe,
      url: request.url
    })

    if (!focusArea || !INSIGHT_FOCUS_AREAS[focusArea]) {
      console.log('Invalid focus area:', { 
        provided: focusArea, 
        validAreas: Object.keys(INSIGHT_FOCUS_AREAS)
      })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid Parameters',
          details: 'Invalid focus area',
          validAreas: Object.keys(INSIGHT_FOCUS_AREAS)
        }),
        { status: 400 }
      )
    }

    // Perform search
    console.log('Starting Tavily search...')
    let searchResults
    try {
      searchResults = await searchTavily(query, focusArea, industries, timeframe)
    } catch (searchError) {
      console.error('Tavily search failed:', searchError)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Search Failed',
          details: searchError instanceof Error ? searchError.message : 'Search service error',
          query,
          focusArea
        }),
        { status: 500 }
      )
    }

    console.log('Tavily search completed:', {
      resultCount: searchResults.length,
      hasResults: searchResults.length > 0
    })

    if (!searchResults.length) {
      console.log('No results found for query:', {
        query,
        focusArea,
        industries
      })
      return new NextResponse(
        JSON.stringify({ 
          results: [],
          message: 'No results found. Try broadening your search or using different terms.',
          searchParams: {
            query,
            focusArea,
            industries,
            timeframe
          }
        }),
        { status: 200 }
      )
    }

    // Process results
    console.log('Processing search results...')
    const processedResults = await Promise.all(
      searchResults.map(async (result, index) => {
        try {
          console.log(`Processing result ${index + 1}/${searchResults.length}`)
          const content = result.content || result.description || ''
          if (!content) {
            console.log(`Skipping result ${index + 1} - no content`)
            return null
          }

          console.log(`Generating title for result ${index + 1}`)
          const title = await generateTitle(content, result.title)
          
          return {
            id: `result-${index}`,
            title,
            content,
            url: result.url,
            focus_area: focusArea,
            source: result.source,
            published_date: result.published_date
          }
        } catch (error) {
          console.error(`Error processing result ${index + 1}:`, error)
          return null
        }
      })
    ).then(results => results.filter((r): r is NonNullable<typeof r> => r !== null))

    // Generate immediate summary from all results
    console.log('Generating summary from all results...')
    const combinedContent = processedResults
      .map(result => `Title: ${result.title}\n\nContent: ${result.content}`)
      .join('\n\n---\n\n')
    
    // Determine if we should use the creative mode based on result count
    const useCreativeMode = processedResults.length <= 3 // Threshold for limited results
    
    // Prepare search context
    const searchContext = {
      query,
      focusArea,
      industries: industries || [],
      timeframe
    }
    
    const summary = await summarizeWithDeepseek(
      combinedContent, 
      focusArea, 
      query,
      useCreativeMode,
      searchContext // Pass the search context
    )

    // Add References section to the summary
    const references = processedResults
      .map((result, index) => `${index + 1}. ${result.title} - ${result.url}`)
      .join('\n')
    
    const summaryWithReferences = `${summary}\n\nReferences:\n${references}`

    return new NextResponse(
      JSON.stringify({
        results: processedResults,
        summary: summaryWithReferences
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('Search error:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Search Error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined
      }),
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