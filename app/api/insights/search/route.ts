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
  originalSource?: boolean
}

// Extend the Insight type to include the originalSource property
interface ExtendedInsight extends Insight {
  originalSource?: boolean;
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
    
    // Don't add any additional keywords to keep the query as clean as possible
  } else {
    // If no specific query, use only the first keyword to keep it focused
    queryParts.push(focusAreaInfo.keywords[0])
  }
  
  // Add industries if specified (but keep it simple)
  if (industries?.length) {
    // Only add the first industry to avoid over-filtering
    queryParts.push(industries[0])
  }

  // Only add "change management" if absolutely necessary and query is very short
  if (!query.toLowerCase().includes('change management') && queryParts.join(' ').length < 10) {
    queryParts.push("change management")
  }

  // Combine with simple spaces - no special weighting or complex combinations
  const searchQuery = queryParts.join(' ')
  console.log('Constructed search query:', searchQuery)

  const searchParams = {
    query: searchQuery,
    search_depth: "basic",
    include_answer: true,
    max_results: 10, // Increased from 5 to 10 for more comprehensive results
    search_type: "keyword",
    // Include only the most relevant domains
    include_domains: [
      'hbr.org', 'mckinsey.com', 'bcg.com',
      'deloitte.com', 'pwc.com'
    ],
    exclude_domains: [
      'youtube.com', 'facebook.com', 'twitter.com',
      'instagram.com', 'linkedin.com'
    ],
    // Increase search timeout to avoid server-side timeouts
    search_timeout: 30 // seconds - increased from 20s to 30s
  }

  try {
    console.log('Making Tavily API request with params:', JSON.stringify(searchParams, null, 2))
    
    // Create an AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000); // Increased from 25s to 40s timeout for the Tavily API request
    
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

    // Store the raw Tavily results for reference
    const tavilyOriginalResults = data.results;

    // Simplify the scoring and filtering of results
    const scoredResults = data.results
      .filter((result: SearchResult) => {
        // Only filter out empty content
        return result.content && result.content.length > 0
      })
      // Add the original source data to each result
      .map((result: SearchResult) => {
        return {
          ...result,
          originalSource: true, // Flag to indicate this is an original Tavily source
          source: result.source || (new URL(result.url).hostname.replace(/^www\./, ''))
        };
      });

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
    originalSources?: {url: string, source?: string, title?: string}[]
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

  // Format the original sources for references
  const sourcesInfo = searchContext.originalSources && searchContext.originalSources.length > 0 ? 
    `\n\nOriginal Sources (MUST be included in References section):
${searchContext.originalSources.map((s, i) => 
  `${i+1}. ${s.source || new URL(s.url).hostname.replace(/^www\./, '')} - ${s.title || 'Article'} 
   URL: ${s.url}`
).join('\n')}` : '';

  try {
    // Generate a clean title that summarizes the insight search
    const generatedTitle = `${focusAreaInfo.label} Insights: ${searchQuery}`

    // Updated system prompt for UK English and proper formatting with the exact requested sections
    const systemPrompt = `You are an expert in change management focusing on ${focusAreaInfo.label}.
Create a concise analysis using UK English spelling and grammar with these EXACT sections in this order:

Title (a clear, descriptive title that captures the main theme or key finding)
Context
Summary of Results
Key Findings
Patterns
Follow-up Questions (to help with learning more)
References (with links)

For the Title:
- Generate a concise, descriptive title that captures the main theme
- Do not include "Title:" prefix
- Make it specific to the search results

For the Context section:
- Include the search query and focus area
- Keep it brief and clean
- Use UK English spelling (organisation, not organization; programme, not program; etc.)

For Summary of Results, Key Findings, and Patterns sections:
- Use bullet points (•)
- Be concise and specific
- Focus only on ${focusAreaInfo.label}
- Provide actionable insights
- Use UK English spelling

For Follow-up Questions:
- Suggest 3-5 specific questions that would help deepen understanding
- Make questions specific and directly related to the insights
- Format as bullet points (•)

For References:
- CRITICAL: You MUST include the EXACT original source URLs provided in the Original Sources section
- NEVER modify, shorten, or change the URLs provided in the Original Sources section
- Format as bullet points (•)
- Include all sources from the Original Sources section
- Format EXACTLY as: • [Source Name] - [Full URL]
- The URLs must be complete and exactly as provided

IMPORTANT: Format each section with the heading on its own line, followed by bullet points. Do not add any additional sections or change the order.`

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
            content: `${contextInfo}${sourcesInfo}\n\n${content}`
          }
        ],
        temperature: 0.3, // Lower temperature for faster, deterministic results
        max_tokens: 1000 // Increased from 800 to 1000 for more comprehensive summaries
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

    // Return the summary without adding a title prefix - the title is already the first line
    return cleanedSummary
  } catch (error) {
    console.error('Summarization error:', error)
    return content
  }
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

  console.log('Search request:', {
    query,
    focusArea,
    industries
  })
  
  try {
    // Set a timeout for the entire request processing
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request processing timed out'));
      }, 50000); // Increased from 30s to 50s timeout for the entire request
    });

    // Create a processing promise that will be raced against the timeout
    const processingPromise = (async () => {
      // Step 1: Set up search environment
      console.log('Setting up search')
      
      // Update the loading stage - this function is defined in the client
      const setLoadingStage = (stage: string) => {
        console.log(`Loading stage: ${stage}`)
        // This is a no-op function for the server-side environment
        // The actual setLoadingStage is passed in the client context
      }

      // Step 2: Search for relevant insights using Tavily
      setLoadingStage("Searching through trusted sources...")
      
      // Process the search results
      const searchResults = await searchTavily(query, focusArea, industries)
      console.log(`Found ${searchResults.length} search results from Tavily`)
      
      // Step 3: Process search results
      setLoadingStage("Processing insights...")
      
      // Process search results in batches to avoid timeouts
      const batchSize = 10
      const batches = []
      for (let i = 0; i < searchResults.length; i += batchSize) {
        batches.push(searchResults.slice(i, i + batchSize))
      }
      
      // Define the processBatch function
      const processBatch = async (batch: SearchResult[]) => {
        console.log(`Processing ${batch.length} search results`)
        
        // Map each search result to an insight
        const insights: ExtendedInsight[] = await Promise.all(
          batch.map(async (result: SearchResult) => {
            // Generate a title that better represents the content
            const title = await generateTitle(result.content.slice(0, 500), result.title)
            
            // Create an insight from the search result
            return {
              id: Math.random().toString(36).substring(2, 15),
              title,
              summary: result.content,
              content: [result.content],
              category: focusArea,
              tags: [],
              readTime: `${Math.ceil(result.content.length / 1000)} min read`,
              focus_area: focusArea,
              source: result.source || (new URL(result.url)).hostname.replace(/^www\./, ''),
              url: result.url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              originalSource: result.originalSource || false // Flag to track original Tavily sources
            }
          })
        )

        return insights
      }
      
      const processedBatches = await Promise.all(batches.map(processBatch))
      const processedInsights = processedBatches.flat().filter(Boolean) as ExtendedInsight[]
      
      // Filter out any invalid entries and limit to top results
      const validInsights = processedInsights
        .filter((insight: ExtendedInsight) => 
          insight && 
          insight.title && 
          insight.content && 
          insight.content.length > 0 && 
          insight.url
        )
        .slice(0, 10) // Limit to top 10 results for performance
      
      console.log('Valid insights count:', validInsights.length)

      // Collect original Tavily sources for the summary
      const originalTavilySources = validInsights
        .filter((insight: ExtendedInsight) => insight.originalSource)
        .map((insight: ExtendedInsight) => ({
          url: insight.url || '',  // Ensure url is always a string
          source: insight.source,
          title: insight.title
        }));
      
      console.log('Original Tavily sources count:', originalTavilySources.length);
      
      // Generate a summary if we have valid insights
      let summary = null
      if (validInsights.length > 0) {
        try {
          console.log('Generating summary from insights...')

          // Wait for content to process with a progress indicator
          await new Promise(resolve => setTimeout(resolve, 1500))
          setLoadingStage("Synthesizing insights and generating summary...")
          
          // Combine content for summarization
          // Use just enough content to get a good summary without overloading the model
          const contentForSummary = validInsights
            .map((insight: ExtendedInsight) => insight.summary || insight.content?.[0] || '')
            .join('\n\n---\n\n')
            .substring(0, 10000) // Limit to 10k characters to avoid token limits
          
          // Generate a summary
          const summaryPromise = summarizeWithDeepseek(
            contentForSummary,
            focusArea,
            query,
            false, // Use standard mode
            { 
              query, 
              focusArea, 
              industries,
              originalSources: originalTavilySources 
            }
          )
          
          // Set a timeout for summary generation
          const summaryTimeout = new Promise<string>((resolve) => {
            setTimeout(() => {
              // If summarization takes too long, return a basic summary with the requested format
              // Create nicely formatted references with exact URLs
              const formattedReferences = validInsights.slice(0, 5).map(insight => {
                // Format reference with fallbacks for missing values
                const sourceText = insight.source || 'Source';
                const urlText = insight.url || '#';
                return `• ${sourceText} - ${urlText}`;
              }).join('\n');
              
              const fallbackSummary = `${INSIGHT_FOCUS_AREAS[focusArea].label} Insights: ${query || 'General Search'}

Context
• Search Query: ${query || 'None'}
• Focus Area: ${INSIGHT_FOCUS_AREAS[focusArea].label}
${industries.length ? `• Industries: ${industries.join(', ')}` : ''}

Summary of Results
• Found ${validInsights.length} relevant sources related to ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Sources include ${validInsights.slice(0, 3).map(i => i.source || 'Unknown Source').join(', ')}.
• Review the individual insights for detailed information.

Key Findings
• The search returned multiple perspectives on ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Each source provides unique insights into this focus area.
• Consider reviewing each source for more detailed information.

Patterns
• Multiple sources address aspects of ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Common themes may emerge upon closer examination of each source.
• Industry-specific patterns may be present in the individual insights.

Follow-up Questions (to help with learning more)
• What specific strategies have been most effective for ${INSIGHT_FOCUS_AREAS[focusArea].label}?
• How do different industries approach ${INSIGHT_FOCUS_AREAS[focusArea].label} differently?
• What metrics are commonly used to measure success in ${INSIGHT_FOCUS_AREAS[focusArea].label}?

References (with links)
${formattedReferences}`;
              resolve(fallbackSummary);
            }, 30000); // Increased from 20000 to 30000 ms for processing more sources
          })
          
          // Race between normal summarization and timeout
          summary = await Promise.race([summaryPromise, summaryTimeout])
        } catch (error) {
          console.error('Error generating summary:', error)
          // Provide a basic summary as fallback with the requested format
          
          // Create nicely formatted references with exact URLs
          const errorFormattedReferences = validInsights.slice(0, 5).map(insight => {
            // Format reference with fallbacks for missing values
            const sourceText = insight.source || 'Source';
            const urlText = insight.url || '#';
            return `• ${sourceText} - ${urlText}`;
          }).join('\n');
          
          const errorFallbackSummary = `${INSIGHT_FOCUS_AREAS[focusArea].label} Insights: ${query || 'General Search'}

Context
• Search Query: ${query || 'None'}
• Focus Area: ${INSIGHT_FOCUS_AREAS[focusArea].label}
${industries.length ? `• Industries: ${industries.join(', ')}` : ''}

Summary of Results
• Found ${validInsights.length} relevant sources related to ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Sources include ${validInsights.slice(0, 3).map(i => i.source || 'Unknown Source').join(', ')}.
• Review the individual insights for detailed information.

Key Findings
• The search returned multiple perspectives on ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Each source provides unique insights into this focus area.
• Consider reviewing each source for more detailed information.

Patterns
• Multiple sources address aspects of ${INSIGHT_FOCUS_AREAS[focusArea].label}.
• Common themes may emerge upon closer examination of each source.
• Industry-specific patterns may be present in the individual insights.

Follow-up Questions (to help with learning more)
• What specific strategies have been most effective for ${INSIGHT_FOCUS_AREAS[focusArea].label}?
• How do different industries approach ${INSIGHT_FOCUS_AREAS[focusArea].label} differently?
• What metrics are commonly used to measure success in ${INSIGHT_FOCUS_AREAS[focusArea].label}?

References (with links)
${errorFormattedReferences}`;
          summary = errorFallbackSummary;
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
async function getDefaultCategoryId(): Promise<string | undefined> {
  const category = await prisma.category.findFirst({
    where: { name: 'Digital Transformation' },
  })
  return category?.id
}