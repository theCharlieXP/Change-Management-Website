import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InsightFocusArea } from '@/types/insights'
import { auth } from '@clerk/nextjs'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

const INSIGHT_FOCUS_AREAS: Record<InsightFocusArea, { label: string, description: string, keywords: string[] }> = {
  'challenges-barriers': {
    label: 'Challenges & Barriers',
    description: 'Resistance to change, resource constraints, technological limitations',
    keywords: ['resistance', 'constraints', 'limitations', 'barriers', 'challenges', 'obstacles', 'difficulties']
  },
  'strategies-solutions': {
    label: 'Strategies & Solutions',
    description: 'Approaches to overcome obstacles, implementation methods, innovative practices',
    keywords: ['strategy', 'solution', 'approach', 'method', 'practice', 'implementation', 'innovation']
  },
  'outcomes-results': {
    label: 'Outcomes & Results',
    description: 'ROI, productivity improvements, employee satisfaction metrics',
    keywords: ['ROI', 'results', 'outcomes', 'improvements', 'metrics', 'success', 'impact']
  },
  'key-stakeholders-roles': {
    label: 'Key Stakeholders & Roles',
    description: 'Leadership involvement, employee participation, external partners',
    keywords: ['stakeholder', 'role', 'leadership', 'participation', 'involvement', 'responsibility']
  },
  'best-practices-methodologies': {
    label: 'Best Practices & Methodologies',
    description: 'Agile, Kotter\'s 8-Step Process, ADKAR model',
    keywords: ['best practice', 'methodology', 'framework', 'model', 'process', 'approach']
  },
  'lessons-learned-insights': {
    label: 'Lessons Learned & Insights',
    description: 'Successes and failures, actionable takeaways, case study reflections',
    keywords: ['lesson', 'insight', 'learning', 'takeaway', 'reflection', 'experience']
  },
  'implementation-tactics': {
    label: 'Implementation Tactics',
    description: 'Training programs, communication plans, technology deployment',
    keywords: ['implementation', 'tactic', 'deployment', 'execution', 'rollout', 'adoption']
  },
  'communication-engagement': {
    label: 'Communication & Engagement',
    description: 'Stakeholder communication strategies, employee engagement techniques, feedback mechanisms',
    keywords: ['communication', 'engagement', 'feedback', 'messaging', 'dialogue', 'interaction']
  },
  'metrics-performance': {
    label: 'Metrics & Performance Indicators',
    description: 'Key Performance Indicators (KPIs), performance metrics, adoption rates',
    keywords: ['metric', 'KPI', 'performance', 'measurement', 'indicator', 'benchmark']
  },
  'risk-management': {
    label: 'Risk Management & Mitigation',
    description: 'Risk identification, mitigation strategies, contingency planning',
    keywords: ['risk', 'mitigation', 'contingency', 'prevention', 'management', 'control']
  },
  'technology-tools': {
    label: 'Technology & Tools',
    description: 'Project management software, communication platforms, analytics tools',
    keywords: ['technology', 'tool', 'software', 'platform', 'system', 'application']
  },
  'cultural-transformation': {
    label: 'Cultural Transformation',
    description: 'Shifting organizational culture, values alignment, behavior change',
    keywords: ['culture', 'transformation', 'values', 'behavior', 'mindset', 'alignment']
  },
  'change-leadership': {
    label: 'Change Leadership',
    description: 'Leadership roles in change, leadership training, change champions',
    keywords: ['leadership', 'champion', 'sponsor', 'executive', 'management', 'guidance']
  },
  'employee-training': {
    label: 'Employee Training & Development',
    description: 'Skill development programs, training initiatives, continuous learning',
    keywords: ['training', 'development', 'learning', 'skill', 'education', 'capability']
  },
  'change-sustainability': {
    label: 'Change Sustainability',
    description: 'Ensuring long-term change, embedding change into organizational processes',
    keywords: ['sustainability', 'long-term', 'embedding', 'sustaining', 'maintaining', 'reinforcing']
  }
}

async function searchTavily(
  query: string, 
  focusArea: InsightFocusArea,
  industries?: string[],
  changeFocus?: string[],
  timeframe?: string
) {
  if (!TAVILY_API_KEY) {
    console.error('Tavily API key is missing')
    throw new Error('Tavily API key not configured')
  }

  console.log('Tavily API Key check:', {
    exists: !!TAVILY_API_KEY,
    firstFiveChars: TAVILY_API_KEY.substring(0, 5)
  })

  // Handle time ranges - convert our timeframe values to Tavily's format
  let time_range: string | undefined
  switch (timeframe) {
    case 'last_day': time_range = 'day'; break
    case 'last_week': time_range = 'week'; break
    case 'last_month': time_range = 'month'; break
    case 'last_year': time_range = 'year'; break
    default: time_range = undefined
  }

  // Construct the search query with all context
  const queryParts = []
  
  // Add the user's search query if provided
  if (query) {
    queryParts.push(query)
  }
  
  // Add focus area keywords
  const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea]
  if (!focusAreaInfo) {
    console.error('Invalid focus area:', focusArea)
    throw new Error('Invalid focus area')
  }

  // Add focus area label and keywords with proper formatting
  queryParts.push(`"${focusAreaInfo.label}"`)
  queryParts.push(...focusAreaInfo.keywords.map(keyword => `"${keyword}"`))
  
  // Add industries if specified
  if (industries && industries.length > 0) {
    queryParts.push(`(${industries.map(industry => `"${industry}"`).join(' OR ')})`)
  }
  
  // Add change focus areas if specified
  if (changeFocus && changeFocus.length > 0) {
    queryParts.push(`(${changeFocus.map(focus => `"${focus}"`).join(' OR ')})`)
  }

  // Add "change management" to ensure relevance
  queryParts.push('"change management"')

  const searchQuery = queryParts.join(' ')
  console.log('Constructed Tavily search query:', searchQuery)

  const searchParams = {
    query: searchQuery,
    search_depth: "advanced",
    include_answer: true,
    max_results: 15,
    search_type: "keyword",
    include_domains: [
      'hbr.org',
      'mckinsey.com',
      'bcg.com',
      'deloitte.com',
      'pwc.com',
      'accenture.com',
      'gartner.com',
      'forrester.com',
      'prosci.com',
      'change-management.com',
      'apm.org.uk',
      'pmi.org'
    ],
    exclude_domains: [
      'youtube.com',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com'
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

    // Log the raw response for debugging
    const rawResponse = await response.text()
    console.log('Raw Tavily API response:', rawResponse)

    if (!response.ok) {
      console.error('Tavily API error response:', {
        status: response.status,
        statusText: response.statusText,
        rawResponse
      })
      throw new Error(`Tavily API error: ${rawResponse}`)
    }

    let data
    try {
      data = JSON.parse(rawResponse)
    } catch (error) {
      console.error('Failed to parse Tavily API response:', error)
      throw new Error('Invalid JSON response from Tavily API')
    }
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format from Tavily API')
    }

    if (!Array.isArray(data.results)) {
      console.error('No results array in response:', data)
      throw new Error('No results array in Tavily API response')
    }

    console.log('Tavily API success response:', {
      resultCount: data.results.length,
      firstResult: data.results[0] ? {
        title: data.results[0].title,
        hasContent: !!data.results[0].content,
        hasDescription: !!data.results[0].description,
        url: data.results[0].url
      } : null,
      allUrls: data.results.map((r: { url: string }) => r.url)
    })
    
    return data.results || []
  } catch (error) {
    console.error('Error in searchTavily:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

async function generateTitle(content: string, originalTitle: string) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  if (!DEEPSEEK_API_KEY) {
    return originalTitle.replace(/["']/g, '')
  }

  try {
    const systemMessage = `You are an expert at creating clear, descriptive titles for business content.
Your task is to create a concise, informative title that accurately represents the content.
The title should:
- Be 5-10 words long
- Focus on the main insight or learning
- Use action words where appropriate
- Not include source names, URLs, or any punctuation
- Remove any quotes or speech marks
- Be consistently formatted in title case
- Be clear and professional
- Focus on the business value or key takeaway
- For PDFs, extract the main topic and create an appropriate title`

    const userContent = `Please create a clear, descriptive title for the following content:

Original Title: ${originalTitle}

Content:
${content.substring(0, 1000)}`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userContent }
        ],
        temperature: 0.2,
        max_tokens: 50
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate title')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim().replace(/["']/g, '')
  } catch (error) {
    console.error('Error generating title:', error)
    return originalTitle.replace(/["']/g, '')
  }
}

async function summarizeWithDeepseek(content: string, focusArea: InsightFocusArea) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  if (!DEEPSEEK_API_KEY) {
    console.warn('Deepseek API key not configured, skipping summarization')
    return content
  }

  const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea]

  try {
    const systemMessage = `You are an expert in change management, focusing specifically on ${focusAreaInfo.label}.
Your task is to extract only the most relevant insights related to ${focusAreaInfo.label} from the content.
Create 3-5 clear, concise bullet points that specifically address: ${focusAreaInfo.description}

Rules:
- Only include information directly related to ${focusAreaInfo.label}
- Each bullet point must be a single, clear, actionable insight
- Keep each point to 1-2 lines maximum
- Start each point with • followed by a clear action verb
- Remove any quotes, speech marks, or unnecessary punctuation
- Skip any information not relevant to ${focusAreaInfo.label}
- Focus on practical, implementable insights
- Use clear, professional business language
- Ensure each point stands alone as a complete insight
- Do not include any headers, categories, or other formatting`

    const userContent = `Extract the most important insights about ${focusAreaInfo.label} from the following content:

${content}`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userContent }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Deepseek API error: ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error in summarizeWithDeepseek:', error)
    return content
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication using Clerk
    const { userId } = auth()
    
    // If no userId, return unauthorized
    if (!userId) {
      console.error('Unauthorized request to search endpoint')
      return new NextResponse(
        JSON.stringify({ error: 'Please sign in to search insights' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Search endpoint called by user:', userId)
    const { searchParams } = new URL(request.url)
    
    // Log all search parameters
    console.log('All search parameters:', Object.fromEntries(searchParams.entries()))
    
    // Get and validate search parameters
    const query = searchParams.get('query') || ''
    const focusArea = searchParams.get('focusArea') as InsightFocusArea
    const industries = searchParams.get('industries')?.split(',').filter(Boolean)
    const changeFocus = searchParams.get('changeFocus')?.split(',').filter(Boolean)
    const timeframe = searchParams.get('timeframe') || undefined

    // Validate focus area
    if (!focusArea || !INSIGHT_FOCUS_AREAS[focusArea]) {
      console.error('Invalid focus area:', focusArea)
      return new NextResponse(
        JSON.stringify({ error: 'Please select a valid focus area' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate API key
    if (!TAVILY_API_KEY) {
      console.error('Missing Tavily API key')
      return new NextResponse(
        JSON.stringify({ error: 'Search service is temporarily unavailable' }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Detailed parameter logging
    console.log('Processed search parameters:', {
      query,
      focusArea,
      industries,
      changeFocus,
      timeframe,
      hasTavilyKey: !!TAVILY_API_KEY,
      hasDeepseekKey: !!process.env.DEEPSEEK_API_KEY
    })

    // Search using Tavily
    console.log('Initiating Tavily search...')
    const searchResults = await searchTavily(
      query,
      focusArea,
      industries,
      changeFocus,
      timeframe
    )
    
    console.log('Tavily search completed:', {
      resultCount: searchResults?.length,
      hasResults: !!searchResults?.length,
      firstResultUrl: searchResults?.[0]?.url
    })

    if (!Array.isArray(searchResults)) {
      console.error('Invalid search results format:', {
        type: typeof searchResults,
        value: searchResults
      })
      return new NextResponse(
        JSON.stringify({ error: 'Invalid search results format' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (searchResults.length === 0) {
      console.log('No results found')
      return new NextResponse(
        JSON.stringify([]),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Process results
    console.log('Processing search results...')
    const insights = await Promise.all(
      searchResults.map(async (result: any, index: number) => {
        try {
          console.log(`Processing result ${index + 1}/${searchResults.length}`)
          
          // Validate content
          const content = result.content || result.description || ''
          if (!content) {
            console.log(`Skipping result ${index + 1} - no content:`, result.url)
            return null
          }

          // Generate title
          console.log(`Generating title for result ${index + 1}`)
          let title = result.title
          try {
            title = await generateTitle(content, result.title)
          } catch (error) {
            console.error(`Title generation failed for result ${index + 1}:`, error)
          }

          // Generate summary
          console.log(`Generating summary for result ${index + 1}`)
          let summary = content
          try {
            summary = await summarizeWithDeepseek(content, focusArea)
          } catch (error) {
            console.error(`Summary generation failed for result ${index + 1}:`, error)
          }

          // Create insight object
          const insight = {
            id: result.url,
            title,
            url: result.url,
            summary,
            content: content.split('\n'),
            category: INSIGHT_FOCUS_AREAS[focusArea].label,
            tags: [
              INSIGHT_FOCUS_AREAS[focusArea].label,
              ...(industries || []),
              ...(changeFocus || [])
            ],
            readTime: `${Math.ceil(content.length / 1000)} min`,
            focus_area: focusArea,
            source: result.source || 'Web',
            created_at: result.published_date || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          console.log(`Successfully processed result ${index + 1}:`, {
            title: insight.title,
            summaryLength: insight.summary.length,
            tagsCount: insight.tags.length
          })
          
          return insight
        } catch (error) {
          console.error(`Failed to process result ${index + 1}:`, error)
          return null
        }
      })
    ).then(results => results.filter((result): result is NonNullable<typeof result> => result !== null))

    console.log('Search completed successfully:', {
      totalResults: insights.length,
      processedResults: insights.length
    })

    return new NextResponse(
      JSON.stringify(insights),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Search endpoint error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to search insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
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