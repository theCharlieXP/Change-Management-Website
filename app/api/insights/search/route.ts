import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY?.replace('Bearer ', '')

type CategoryKey = 
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

const CATEGORIES: Record<CategoryKey, string> = {
  'challenges-barriers': 'Challenges & Barriers',
  'strategies-solutions': 'Strategies & Solutions',
  'outcomes-results': 'Outcomes & Results',
  'stakeholders-roles': 'Key Stakeholders & Roles',
  'best-practices': 'Best Practices & Methodologies',
  'lessons-learned': 'Lessons Learned & Insights',
  'implementation-tactics': 'Implementation Tactics',
  'communication-engagement': 'Communication & Engagement',
  'metrics-performance': 'Metrics & Performance Indicators',
  'risk-management': 'Risk Management & Mitigation',
  'technology-tools': 'Technology & Tools'
}

async function searchTavily(query: string, timeframe?: string, industry?: string, category?: CategoryKey, startDate?: string, endDate?: string) {
  if (!TAVILY_API_KEY) {
    throw new Error('Tavily API key not configured')
  }

  // Handle date ranges
  let time_range: string | undefined
  if (startDate && endDate) {
    // Custom date range - convert to Tavily's format
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24))
    
    if (daysDiff <= 1) time_range = 'day'
    else if (daysDiff <= 7) time_range = 'week'
    else if (daysDiff <= 30) time_range = 'month'
    else time_range = 'year'
  } else {
    // Predefined ranges
    switch (timeframe) {
      case 'last_day': time_range = 'day'; break
      case 'last_week': time_range = 'week'; break
      case 'last_month': time_range = 'month'; break
      case 'last_year': time_range = 'year'; break
      default: time_range = undefined
    }
  }

  // Construct the search query with industry and category context
  let searchQuery = query
  const queryParts = []
  
  if (industry && industry !== 'All') {
    queryParts.push(`${industry} industry`)
  }
  
  if (category && CATEGORIES[category]) {
    const categoryName = CATEGORIES[category]
    queryParts.push(`"${categoryName}"`)
    
    // Add relevant keywords based on category
    switch (category) {
      case 'challenges-barriers':
        queryParts.push('challenges obstacles barriers resistance limitations')
        break
      case 'strategies-solutions':
        queryParts.push('strategies solutions approaches methods practices')
        break
      case 'outcomes-results':
        queryParts.push('ROI metrics results outcomes improvements success')
        break
      case 'stakeholders-roles':
        queryParts.push('stakeholders leadership roles responsibilities teams')
        break
      case 'best-practices':
        queryParts.push('best practices methodologies frameworks models')
        break
      case 'lessons-learned':
        queryParts.push('lessons learned insights findings takeaways')
        break
      case 'implementation-tactics':
        queryParts.push('implementation deployment training execution tactics')
        break
      case 'communication-engagement':
        queryParts.push('communication engagement feedback stakeholder management')
        break
      case 'metrics-performance':
        queryParts.push('KPIs metrics measurements performance indicators')
        break
      case 'risk-management':
        queryParts.push('risk management mitigation contingency planning')
        break
      case 'technology-tools':
        queryParts.push('technology tools software platforms systems')
        break
    }
  }

  if (queryParts.length > 0) {
    searchQuery = `${searchQuery} ${queryParts.join(' ')}`
  }

  console.log('Final search query:', searchQuery)

  const searchParams = {
    query: searchQuery,
    search_depth: "advanced",
    include_answer: true,
    max_results: 15,
    ...(time_range && { time_range }),
    search_type: "keyword"
  }

  try {
    console.log('Making Tavily API request with params:', searchParams)
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify(searchParams)
    })

    const responseText = await response.text()
    console.log('Tavily API response:', responseText)

    if (!response.ok) {
      throw new Error(`Tavily API error: ${responseText}`)
    }

    const data = JSON.parse(responseText)
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

async function summarizeWithDeepseek(content: string, category: string) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
  if (!DEEPSEEK_API_KEY) {
    console.warn('Deepseek API key not configured, skipping summarization')
    return content
  }

  try {
    const systemMessage = `You are an expert in change management and business transformation. 
Your task is to analyze and summarize case studies and insights related to ${category}.
Create a structured summary with the following format:

Key Insights:
• [2-3 bullet points of main takeaways]

Challenges:
• [1-2 bullet points of key challenges]

Solutions:
• [1-2 bullet points of implemented solutions]

Outcomes:
• [1-2 bullet points of results and impact]

Keep each bullet point concise and focused on actionable insights.`

    const userContent = `Please summarize the following content in a structured format with bullet points:

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
    const query = searchParams.get('query')
    const timeframe = searchParams.get('timeframe') || undefined
    const industry = searchParams.get('industry') || undefined
    const category = searchParams.get('category') as CategoryKey || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    console.log('Received search request:', { 
      query, timeframe, industry, category, startDate, endDate 
    })

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    // Search using Tavily with all parameters
    const searchResults = await searchTavily(
      query, 
      timeframe, 
      industry, 
      category,
      startDate,
      endDate
    )
    
    console.log('Received search results:', searchResults.length)

    // Filter out results with low relevance scores if available
    const relevantResults = searchResults.filter((result: any) => {
      // Check if the result matches the search criteria
      const content = (result.content || result.description || '').toLowerCase()
      const title = (result.title || '').toLowerCase()
      const searchTerms = query.toLowerCase().split(' ')
      
      // Result must contain at least one search term in title or content
      const hasSearchTerm = searchTerms.some(term => 
        title.includes(term) || content.includes(term)
      )

      // If category is selected, result must contain category-related terms
      if (category && CATEGORIES[category]) {
        const categoryTerms = CATEGORIES[category].toLowerCase().split(' ')
        const hasCategoryTerm = categoryTerms.some(term =>
          title.includes(term) || content.includes(term)
        )
        return hasSearchTerm && hasCategoryTerm
      }

      return hasSearchTerm
    })

    // Process and transform results
    const insights = await Promise.all(
      relevantResults.map(async (result: any) => {
        const categoryName = category ? CATEGORIES[category] : (result.category || 'General')
        const categoryObj = {
          id: category || 'web-search',
          name: categoryName
        }

        // Generate a proper title
        const title = await generateTitle(result.content || result.description, result.title)

        // Generate a summary using Deepseek if content is available
        let summary = result.description
        if (result.content) {
          try {
            summary = await summarizeWithDeepseek(result.content, categoryObj.name)
          } catch (error) {
            console.error('Error summarizing content:', error)
            summary = result.description
          }
        }

        return {
          id: result.url,
          title,
          summary,
          content: result.content || result.description,
          category: categoryObj,
          createdAt: result.published_date || new Date().toISOString(),
          readTime: Math.ceil((result.content?.length || 0) / 1000),
          source: result.url,
          tags: result.keywords || []
        }
      })
    )

    console.log('Processed insights:', insights.length)
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