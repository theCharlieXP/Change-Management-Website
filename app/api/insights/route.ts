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
            content: `You are a senior change management expert with 20+ years of experience in the field. 

YOUR TASK:
Create a detailed, actionable analysis of case studies related to ${category}.

FORMAT REQUIREMENTS:
1. TITLE: Capitalize The First Letter Of Every Word
2. STRUCTURE: 
   - DO NOT include a Context section
   - Focus on key insights, metrics, and lessons learned
   - Write in clear paragraphs with complete thoughts
3. STYLE:
   - Write in an authoritative, professional tone
   - Ensure every sentence is complete - never truncate thoughts
   - Provide substantive analysis that would be valuable to practitioners
   - Write in professional UK English (organisation, centre, programme)
   - Focus on actionable insights with "why it matters" explanations

Your analysis will be rejected if:
- It includes a Context section
- Title words are not properly capitalized 
- Sentences are truncated or incomplete
- Content is generic or superficial`
          },
          {
            role: 'user',
            content: `Please analyze and summarize the following content into a structured case study format:
            ${content}`
          }
        ],
        temperature: 0.1,
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