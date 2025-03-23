import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Set proper runtime for Prisma compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function searchTavily(query: string) {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('Tavily API key is not configured')
  }

  console.log('Using Tavily API key:', apiKey) // Temporary log to debug

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `${query} change management case study`,
        search_depth: 'advanced',
        include_domains: [
          'hbr.org',
          'mckinsey.com',
          'bcg.com',
          'deloitte.com',
          'pwc.com',
          'accenture.com',
          'gartner.com',
          'forrester.com',
        ],
        include_answer: true,
        max_results: 5,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Tavily API error response:', errorText)
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Tavily API call failed:', error)
    throw error
  }
}

async function summarizeWithDeepseek(content: string, category: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('Deepseek API key is not configured')
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a senior expert in change management and business transformation with 20+ years of experience in the field. 
            Your task is to analyze and summarize content related to ${category} initiatives.
            Focus on key insights, metrics, and lessons learned.
            
            Critical guidelines for your analysis:
            1. Write complete, well-formed sentences that provide comprehensive insights
            2. Never truncate or cut off sentences - ensure every thought is complete
            3. Provide substantive, actionable analysis that would be valuable to change management practitioners
            4. Write in a polished, authoritative style befitting a senior change management consultant
            5. Ensure your analysis reflects deep expertise and knowledge of best practices
            6. Format in clear paragraphs with proper beginning and end to each thought`
          },
          {
            role: 'user',
            content: `Please analyze and summarize the following content into a structured case study format:
            ${content}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Deepseek API error response:', errorText)
      throw new Error(`Deepseek API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return result.choices[0].message.content
  } catch (error) {
    console.error('Deepseek API call failed:', error)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build the where clause based on filters
    const where: any = {}

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ]
    }

    if (category) {
      where.categoryId = category
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // First, try to find matching insights in our database
    let insights = await prisma.insight.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
    })

    // If we have a query and no results, search using Tavily and process with Deepseek
    if (query && insights.length === 0) {
      console.log('No results found in database, searching with Tavily...')
      try {
        const searchResults = await searchTavily(query)
        console.log('Tavily search results:', searchResults) // Temporary log to debug
        
        // Get the default category for new insights
        const defaultCategory = await prisma.category.findFirst({
          where: { name: 'Digital Transformation' },
        })

        if (!defaultCategory) {
          throw new Error('Default category not found')
        }

        // Process and save each result
        const processedResults = await Promise.all(
          searchResults.results.map(async (result: any) => {
            try {
              const summary = await summarizeWithDeepseek(
                result.content,
                category || 'general change management'
              )

              // Save the processed insight
              const insight = await prisma.insight.create({
                data: {
                  title: result.title,
                  summary: result.description,
                  content: summary,
                  categoryId: defaultCategory.id,
                  tags: result.keywords || [],
                  readTime: Math.ceil(summary.length / 1000),
                  source: result.url,
                },
                include: {
                  category: true,
                },
              })

              return insight
            } catch (error) {
              console.error('Error processing result:', error)
              return null
            }
          })
        )

        insights = processedResults.filter((result): result is NonNullable<typeof result> => result !== null)
      } catch (error) {
        console.error('Error in external API processing:', error)
        // Return existing insights instead of failing completely
        return NextResponse.json(insights)
      }
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Error in insights route:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 