import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InsightFocusArea, INSIGHT_FOCUS_AREAS } from '@/types/insights'
import { auth } from '@clerk/nextjs/server'
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client'

const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_TAVILY === 'true'

// Add debug logging for the API key
console.log('Tavily API Key available:', !!TAVILY_API_KEY);
console.log('Development mode (mock Tavily):', DEV_MODE);

if (!TAVILY_API_KEY && !DEV_MODE) {
  console.warn('WARNING: TAVILY_API_KEY is not configured in environment variables');
}

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
      // Log the search query and parameters
      console.log('Search request:', {
        query: searchQuery,
        focusArea,
        includeIndustries: industries,
        devMode: DEV_MODE
      });
      
      if (!TAVILY_API_KEY && !DEV_MODE) {
        throw new Error('TAVILY_API_KEY is missing. Please configure it in your environment variables or enable DEV_MODE for testing.');
      }
      
      let results: SearchResult[] = [];
      
      if (DEV_MODE) {
        // Generate mock Tavily results based on the query
        console.log('Using mock Tavily results in development mode');
        results = getMockTavilyResults(searchQuery, focusArea);
      } else {
        // Call the real Tavily API
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
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          console.error(`Tavily API error: Status ${response.status}, Response:`, errorText);
          throw new Error(`Tavily Search API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Tavily search returned results:', data.results?.length || 0);
        results = data.results as SearchResult[];
      }

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
      });
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

// Function to generate mock Tavily results for development testing
function getMockTavilyResults(query: string, focusArea: string): SearchResult[] {
  // Create domain-specific mock results based on the focus area
  const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea as InsightFocusArea];
  
  return [
    {
      title: `${query}: Best Practices for ${focusAreaInfo.label}`,
      content: `This article explores the best practices for ${focusAreaInfo.label} in modern organizations.
The most effective approaches involve stakeholder engagement, clear communication, and systematic planning.
Research shows that organizations that excel at ${focusAreaInfo.label} are 2.5x more likely to outperform their peers in change implementation success rates.
Key considerations include: establishing a clear vision, developing a structured approach, engaging stakeholders at all levels, providing adequate resources, and measuring progress through defined metrics.`,
      url: `https://hbr.org/change-management/${focusArea.toLowerCase().replace(/-/g, '-')}`,
      source: 'Harvard Business Review',
      score: 0.92
    },
    {
      title: `${focusAreaInfo.label}: Industry Analysis and Insights`,
      content: `This report analyzes current trends and challenges in ${focusAreaInfo.label}.
Organizations face significant barriers including resistance to change, lack of executive sponsorship, and insufficient resources.
The analysis found that ${query} directly impacts organizational performance when properly implemented.
Companies that develop robust ${focusAreaInfo.label.toLowerCase()} practices report 30% higher employee engagement and 25% lower implementation costs.
The study outlines five critical success factors for effective ${focusAreaInfo.label.toLowerCase()}.`,
      url: `https://mckinsey.com/insights/${focusArea.toLowerCase()}`,
      source: 'McKinsey & Company',
      score: 0.89
    },
    {
      title: `Case Studies: ${query} in Action`,
      content: `This collection of case studies examines how leading organizations have successfully implemented ${query} strategies.
The research identifies patterns across industries including healthcare, technology, and manufacturing.
One notable example is Company X, which increased change adoption rates by 45% through their innovative approach to ${focusAreaInfo.label.toLowerCase()}.
Key success factors identified include: executive sponsorship, dedicated change resources, comprehensive training programs, and regular feedback mechanisms.
The case studies provide actionable frameworks that can be adapted to various organizational contexts.`,
      url: `https://prosci.com/resources/case-studies/${focusArea.toLowerCase()}`,
      source: 'Prosci',
      score: 0.87
    },
    {
      title: `Measuring Success in ${focusAreaInfo.label}`,
      content: `This research paper explores metrics and measurement frameworks for evaluating ${focusAreaInfo.label.toLowerCase()} effectiveness.
Organizations often struggle to quantify the impact of ${query} initiatives due to the complex nature of organizational change.
The study proposes a balanced scorecard approach incorporating leading and lagging indicators across four dimensions: financial impact, operational efficiency, stakeholder engagement, and capability development.
Survey results from 250 organizations reveal that those with robust measurement systems are 3x more likely to achieve their change objectives.
Recommended metrics include: adoption rates, productivity impact, stakeholder feedback, resource utilization, and ROI calculations.`,
      url: `https://deloitte.com/insights/${focusArea.toLowerCase()}-measurement`,
      source: 'Deloitte',
      score: 0.85
    }
  ];
}