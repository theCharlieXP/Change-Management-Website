import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InsightFocusArea, INSIGHT_FOCUS_AREAS } from '@/types/insights'
import { auth } from '@clerk/nextjs/server'
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

interface SearchResult {
  title: string
  content: string
  url: string
  source?: string
  score: number
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const focusArea = searchParams.get('focusArea') as InsightFocusArea || 'challenges-barriers'
  const industriesParam = searchParams.get('industries') || ''
  const industries = industriesParam ? industriesParam.split(',') : []
  
  // Validate required parameters
  if (!focusArea || !Object.keys(INSIGHT_FOCUS_AREAS).includes(focusArea)) {
    return NextResponse.json(
      { error: 'Invalid or missing focus area' },
      { status: 400 }
    )
  }

  // Check user's usage before proceeding
  const authData = await auth()
  const userId = authData.userId
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's subscription status first
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { 
        userId,
        status: 'active'
      }
    })

    const isPremium = userSubscription?.plan === 'pro'
    const limit = isPremium ? 100 : 20 // Pro users get 100 searches per day, free users get 20 total

    // Check current usage
    const currentUsage = await prisma.usageTracker.findFirst({
      where: {
        userId,
        featureId: INSIGHT_SEARCH_FEATURE,
        ...(isPremium ? {
          lastUsedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        } : {})
      }
    })

    // If no usage record exists, create one
    if (!currentUsage) {
      await prisma.usageTracker.create({
        data: {
          userId,
          featureId: INSIGHT_SEARCH_FEATURE,
          count: 1,
          lastUsedAt: new Date()
        }
      })
    } else if (currentUsage.count >= limit) {
      return NextResponse.json(
        { 
          error: isPremium ? 'Daily usage limit reached' : 'Total usage limit reached. Please upgrade to Pro to continue searching.',
          limitReached: true,
          limit,
          isPremium
        },
        { status: 403 }
      )
    } else {
      // Increment usage
      await prisma.usageTracker.update({
        where: { id: currentUsage.id },
        data: { 
          count: currentUsage.count + 1,
          lastUsedAt: new Date()
        }
      })
    }

    // Continue with the search...
    const searchQuery = `${query} ${INSIGHT_FOCUS_AREAS[focusArea].description}`
    const searchTimeout = 15000 // 15 seconds timeout

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), searchTimeout)

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TAVILY_API_KEY}`
        },
        body: JSON.stringify({
          query: searchQuery,
          search_depth: 'advanced',
          max_results: 10,
          include_domains: [
            'hbr.org',
            'mckinsey.com',
            'bcg.com',
            'prosci.com',
            'strategy-business.com',
            'deloitte.com',
            'accenture.com',
            'pwc.com',
            'kpmg.com',
            'ey.com',
            'gartner.com',
            'forrester.com',
            'forbes.com',
            'harvard.edu',
            'mit.edu',
            'stanford.edu',
            'change-management.com',
            'apm.org.uk',
            'pmi.org',
            'shrm.org'
          ],
          exclude_domains: [
            'youtube.com',
            'facebook.com',
            'twitter.com',
            'instagram.com',
            'tiktok.com',
            'reddit.com',
            'pinterest.com',
            'linkedin.com'
          ]
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}`)
      }

      const data = await response.json()
      const results = data.results as SearchResult[]

      return NextResponse.json({
        query: searchQuery,
        focusArea: focusArea,
        results: results.map(result => ({
          title: result.title,
          summary: result.content,
          content: result.content,
          url: result.url,
          source: result.source || new URL(result.url).hostname,
          focus_area: focusArea,
          readTime: Math.ceil(result.content.split(' ').length / 200), // Approximate read time in minutes
          tags: [INSIGHT_FOCUS_AREAS[focusArea].label],
          created_at: new Date().toISOString()
        }))
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Search request timed out' },
          { status: 504 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error processing search request:', error)
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