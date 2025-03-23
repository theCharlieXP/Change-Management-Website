import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { summarizeWithDeepseek } from '@/lib/ai-utils'
import { InsightFocusArea } from '@/types/insights'

// Set proper runtime for compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'default-no-store'

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

export async function GET(request: Request) {
  try {
    // Parse the request query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeContent = searchParams.get('includeContent') === 'true'

    // Check authentication
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Query the database using Prisma
    let insights = []

    if (query) {
      insights = await prisma.insight.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
    } else if (category) {
      insights = await prisma.insight.findMany({
        where: {
          category: {
            name: category,
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
    } else if (tag) {
      insights = await prisma.insight.findMany({
        where: {
          tags: {
            has: tag,
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
    } else {
      insights = await prisma.insight.findMany({
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
    }

    // If not including content, remove it to reduce response size
    if (!includeContent) {
      insights = insights.map((insight) => {
        const { content, ...rest } = insight
        return rest
      })
    }

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
              // Format the content for DeepSeek
              const contentToAnalyze = `
SEARCH QUERY: ${query}
FOCUS AREA: General Change Management
SOURCE: ${result.url}
TITLE: ${result.title}

CONTENT:
${result.content}
`;

              // Use our global summarizeWithDeepseek function
              const summary = await summarizeWithDeepseek(
                contentToAnalyze,
                'general' as InsightFocusArea
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
        console.error('Error searching or processing results:', error)
      }
    }

    // Return the results
    return new NextResponse(
      JSON.stringify({ insights }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error handling insights request:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to retrieve insights' }),
      { status: 500 }
    )
  }
} 