import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY?.replace('Bearer ', '')

type InsightFocusArea = 
  | 'challenges-barriers'
  | 'strategies-solutions'
  | 'outcomes-results'
  | 'stakeholders-roles'
  | 'best-practices'
  | 'lessons-learned'
  | 'implementation-tactics'
  | 'communication-engagement'
  | 'metrics-performance'
  | 'risk-management'
  | 'technology-tools'
  | 'cultural-transformation'
  | 'change-leadership'
  | 'employee-training'
  | 'change-sustainability'

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
  'stakeholders-roles': {
    label: 'Key Stakeholders & Roles',
    description: 'Leadership involvement, employee participation, external partners',
    keywords: ['stakeholder', 'role', 'leadership', 'participation', 'involvement', 'responsibility']
  },
  'best-practices': {
    label: 'Best Practices & Methodologies',
    description: 'Agile, Kotter\'s 8-Step Process, ADKAR model',
    keywords: ['best practice', 'methodology', 'framework', 'model', 'process', 'approach']
  },
  'lessons-learned': {
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
    throw new Error('Tavily API key not configured')
  }

  // Handle time ranges - convert our timeframe values to Tavily's format
  let time_range: string | undefined
  switch (timeframe) {
    case 'last_day': time_range = 'day'; break
    case 'last_week': time_range = 'week'; break
    case 'last_month': time_range = 'month'; break
    case 'last_year': time_range = 'year'; break
    // For longer periods, default to 'year' as that's the maximum Tavily supports
    case 'last_5_years':
    case 'last_10_years':
    case 'last_20_years':
      time_range = 'year'; break
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
  queryParts.push(`"${focusAreaInfo.label}"`)
  queryParts.push(...focusAreaInfo.keywords)
  
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
  console.log('Final search query:', searchQuery)

  const searchParams = {
    query: searchQuery,
    search_depth: "advanced",
    include_answer: true,
    max_results: 15,
    search_type: "keyword",
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tavily API error response:', errorText)
      throw new Error(`Tavily API error: ${errorText}`)
    }

    const data = await response.json()
    console.log('Tavily API success response:', JSON.stringify(data, null, 2))
    return data.results || []
  } catch (error) {
    console.error('Error in searchTavily:', error)
    throw error
  }
}

async function generateTitle(content: string, originalTitle: string) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  if (!DEEPSEEK_API_KEY) {
    return originalTitle
  }

  try {
    const systemMessage = `You are an expert at creating clear, descriptive titles for business content.
Your task is to create a concise, informative title that accurately represents the content.
The title should:
- Be 5-10 words long
- Focus on the main insight or learning
- Use action words where appropriate
- Not include source names or URLs
- Be consistently formatted in title case
- For PDFs, extract the main topic and create an appropriate title`

    const userContent = `Please create a clear, descriptive title for the following content:

Original Title: ${originalTitle}

Content:
${content.substring(0, 1000)} // Limit content length for title generation`

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
        temperature: 0.3,
        max_tokens: 50
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate title')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Error generating title:', error)
    return originalTitle
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
- Each bullet point should be 1-2 lines maximum
- Be direct and actionable
- Remove any quotes or speech marks
- Skip any information not relevant to ${focusAreaInfo.label}
- It's okay to have fewer points if there isn't enough relevant information
- Do not include any headers or categories
- Start each bullet point with •`

    const userContent = `Extract insights about ${focusAreaInfo.label} from the following content:

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
        temperature: 0.3,
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
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') ?? ''
    const focusArea = searchParams.get('focusArea') as InsightFocusArea
    const industries = searchParams.get('industries')?.split(',').filter(Boolean)
    const changeFocus = searchParams.get('changeFocus')?.split(',').filter(Boolean)
    const timeframe = searchParams.get('timeframe') || undefined

    console.log('Received search request:', { 
      query, focusArea, industries, changeFocus, timeframe
    })

    if (!focusArea) {
      return NextResponse.json({ error: 'Focus Area is required' }, { status: 400 })
    }

    if (!TAVILY_API_KEY) {
      return NextResponse.json({ error: 'Search API is not configured' }, { status: 500 })
    }

    // Search using Tavily with all parameters
    const searchResults = await searchTavily(
      query,
      focusArea,
      industries,
      changeFocus,
      timeframe
    )
    
    console.log('Raw search results count:', searchResults.length)

    if (!Array.isArray(searchResults)) {
      console.error('Invalid search results format:', searchResults)
      return NextResponse.json({ error: 'Invalid search results format' }, { status: 500 })
    }

    if (searchResults.length === 0) {
      return NextResponse.json([])
    }

    // Process and transform results
    const insights = await Promise.all(
      searchResults.map(async (result: any) => {
        try {
          // Ensure we have content to work with
          const content = result.content || result.description || ''
          if (!content) {
            console.log('Skipping result with no content:', result.url)
            return null
          }

          // Generate a proper title
          let title = result.title
          try {
            title = await generateTitle(content, result.title)
            console.log('Generated title:', title)
          } catch (error) {
            console.error('Error generating title:', error)
          }

          // Generate a summary using Deepseek
          let summary = content
          try {
            summary = await summarizeWithDeepseek(content, focusArea)
            console.log('Generated summary length:', summary.length)
          } catch (error) {
            console.error('Error generating summary:', error)
          }

          // Extract relevant tags
          const tags = new Set<string>()
          tags.add(INSIGHT_FOCUS_AREAS[focusArea].label)
          if (industries) {
            industries.forEach(industry => tags.add(industry))
          }
          if (changeFocus) {
            changeFocus.forEach(focus => tags.add(focus))
          }

          return {
            id: result.url,
            title,
            summary,
            content,
            focusArea,
            createdAt: result.published_date || new Date().toISOString(),
            readTime: Math.ceil(content.length / 1000),
            source: result.url,
            tags: Array.from(tags)
          }
        } catch (error) {
          console.error('Error processing result:', error)
          return null
        }
      })
    ).then(results => results.filter((result): result is NonNullable<typeof result> => result !== null))

    console.log('Final processed insights count:', insights.length)
    
    if (insights.length === 0) {
      console.log('No insights after processing, returning empty array')
      return NextResponse.json([])
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search insights',
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