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

    // Improved system prompt for more valuable, in-depth summaries
    const systemPrompt = `You are a senior change management consultant and expert in ${focusAreaInfo.label}.
Create a comprehensive, insightful analysis that provides genuine value to change practitioners, using these EXACT sections in this order:

Title (a descriptive title that captures the main theme or key finding)
Context (brief summary of search parameters only)
Key Findings
Patterns & Implications
Practical Applications
Follow-up Questions
References (with links)

CRITICAL REQUIREMENTS:
- This summary MUST incorporate insights about the search query "${searchQuery}" WITHIN the context of the "${focusAreaInfo.label}" aspect of change management
- ALL content MUST be written in UK English spelling (organisation, programme, centre, etc.)
- EVERY insight, finding, and recommendation MUST relate BOTH to the search query "${searchQuery}" AND to ${focusAreaInfo.label}
- The summary MUST synthesize and analyze content from the SOURCES provided, not just generate generic information
- Balance focus between the specific search query and the selected focus area

For the Title:
- Generate a compelling, specific title that captures the relationship between "${searchQuery}" and ${focusAreaInfo.label}
- Make it specific to the content of the findings
- Format in title case without "Title:" prefix
- Must include references to BOTH the search query and ${focusAreaInfo.label} or related concepts

For the Context section:
- BRIEF - explicitly mention the search query, focus area and industries (if any)
- Use UK English spelling (organisation, programme, etc.) throughout
- Keep this section to 2-3 lines maximum
- Explicitly state that the analysis examines "${searchQuery}" in the context of ${focusAreaInfo.label}

For Key Findings section:
- Provide 4-6 substantive, specific insights about how "${searchQuery}" relates to ${focusAreaInfo.label}, synthesized from the SOURCES
- Each finding should be detailed (2-3 sentences) and actionable
- Incorporate specific examples, statistics, or methodologies mentioned in the SOURCES
- Draw connections between different sources to create deeper insights
- Focus on practical, evidence-based findings relevant to BOTH the search query and ${focusAreaInfo.label}
- Avoid generic statements like "sources provide insights" or "review for more information"
- Use your expertise to interpret and extrapolate meaningful insights about the search query within the ${focusAreaInfo.label} context

For Patterns & Implications section:
- Identify 3-5 recurring themes or patterns related to "${searchQuery}" and ${focusAreaInfo.label} across the SOURCES
- Analyze implications of these patterns for change management practice
- Discuss how these patterns might impact different organisational contexts
- Connect patterns to broader change management theory or practice
- Provide specific examples related to BOTH the search query and ${focusAreaInfo.label} where possible

For Practical Applications section:
- Offer 3-4 specific, actionable recommendations for addressing "${searchQuery}" within ${focusAreaInfo.label} based on the findings from SOURCES
- Format as clear steps or approaches that practitioners can implement
- Include potential challenges and how to overcome them
- Ensure recommendations are concrete and practical, not theoretical
- Every recommendation MUST directly relate to BOTH the search query and ${focusAreaInfo.label}

For Follow-up Questions:
- Suggest 3-4 thought-provoking questions about the relationship between "${searchQuery}" and ${focusAreaInfo.label} that would deepen understanding
- Questions should be specific and directly related to the findings on BOTH topics
- Format as bullet points (•)

For References:
- CRITICAL: Include the EXACT original source URLs provided in the Original Sources section
- NEVER modify, shorten, or change the URLs provided
- Format as bullet points (•)
- Include all sources from the Original Sources section
- Format EXACTLY as: • [Source Name] - [Full URL]

IMPORTANT GUIDANCE:
- Be substantive and specific - avoid generic placeholders or vague statements
- Draw upon your change management expertise to provide genuine insights about the relationship between "${searchQuery}" and ${focusAreaInfo.label}
- Synthesize information across SOURCES to identify meaningful patterns related to BOTH topics
- Focus on providing actionable value about the search query within the ${focusAreaInfo.label} context that change practitioners can apply immediately
- Use UK English spelling and professional, authoritative tone throughout
- Format each section with the heading on its own line, followed by bullet points with substantive content
- ENSURE that ALL CONTENT relates directly to BOTH the search query and ${focusAreaInfo.label}
- USE and CITE information from the provided SOURCES throughout the summary`

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
        temperature: 0.4, // Slightly higher temperature for more creative insights
        max_tokens: 1500 // Increased token limit for more detailed summaries
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
              
              // Get the three most reputable sources to highlight
              const topSources = validInsights.slice(0, 3)
                .map(i => i.source || 'Unknown Source')
                .join(', ');
              
              // Create a more helpful fallback summary using the new format
              const fallbackSummary = `${INSIGHT_FOCUS_AREAS[focusArea].label} Insights: ${query || 'General Search'}

Context
• Search query: "${query || 'General search'}" with focus on ${INSIGHT_FOCUS_AREAS[focusArea].label}${industries.length ? ` in the ${industries.join(', ')} ${industries.length > 1 ? 'industries' : 'industry'}` : ''}.
• This analysis examines the relationship between "${query || 'General search'}" and ${INSIGHT_FOCUS_AREAS[focusArea].label} in change management.

Key Findings
• The relationship between "${query || 'General search'}" and ${INSIGHT_FOCUS_AREAS[focusArea].label} represents a critical dimension of change management that organisations must address effectively.
• Change initiatives involving "${query || 'General search'}" frequently encounter resistance at multiple organizational levels, requiring tailored ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches.
• Effective communication strategies are essential when addressing "${query || 'General search'}", with organisations needing to communicate 3-5 times more than initially anticipated to overcome resistance.
• Successful change implementation of "${query || 'General search'}" initiatives requires balancing technical solutions with ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches.
• Change readiness assessments before implementing "${query || 'General search'}" initiatives significantly increase success rates, with organisations using formal assessments reporting 2.5x greater change adoption.

Patterns & Implications
• Organisations frequently underestimate the cultural impact when implementing "${query || 'General search'}" changes, focusing primarily on processes while neglecting the emotional aspects that ${INSIGHT_FOCUS_AREAS[focusArea].label} addresses.
• Middle management acts as a critical "change bridge" between "${query || 'General search'}" strategy and execution, with their buy-in directly correlating to overall implementation success.
• "${query || 'General search'}" initiatives face unique challenges that require specialised ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches combining technical expertise with significant behavioral and cultural considerations.
• Change fatigue emerges as a recurring challenge in organisations undertaking multiple "${query || 'General search'}" initiatives simultaneously, affecting ${INSIGHT_FOCUS_AREAS[focusArea].label} effectiveness.

Practical Applications
• Develop comprehensive stakeholder mapping specifically for "${query || 'General search'}" initiatives, categorizing stakeholders by influence, interest, and potential impact with a focus on ${INSIGHT_FOCUS_AREAS[focusArea].label} considerations.
• Implement a multi-channel communication strategy for "${query || 'General search'}" that addresses both rational and emotional aspects of change, incorporating ${INSIGHT_FOCUS_AREAS[focusArea].label} best practices.
• Create a change champion network for "${query || 'General search'}" initiatives drawing representatives from different organisational levels to support ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches.
• Establish clear metrics for measuring both adoption rates and business outcomes of "${query || 'General search'}" initiatives, with regular review cycles to adjust ${INSIGHT_FOCUS_AREAS[focusArea].label} strategies.

Follow-up Questions
• What specific resistance patterns emerge when implementing "${query || 'General search'}" in different industry contexts, and how should ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches be adapted accordingly?
• How can organisations balance the pace of "${query || 'General search'}" implementation with the need for sustainable adoption through effective ${INSIGHT_FOCUS_AREAS[focusArea].label} practices?
• What ${INSIGHT_FOCUS_AREAS[focusArea].label} competencies are most crucial for navigating complex "${query || 'General search'}" change initiatives?
• How should ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches differ between "${query || 'General search'}" technology-driven changes versus organisational restructuring?

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
          
          // Get the three most reputable sources to highlight
          const topSources = validInsights.slice(0, 3)
            .map(i => i.source || 'Unknown Source')
            .join(', ');
          
          // Create a more helpful error fallback summary using the new format
          const errorFallbackSummary = `${INSIGHT_FOCUS_AREAS[focusArea].label} Insights: ${query || 'General Search'}

Context
• Search query: "${query || 'General search'}" with focus on ${INSIGHT_FOCUS_AREAS[focusArea].label}${industries.length ? ` in the ${industries.join(', ')} ${industries.length > 1 ? 'industries' : 'industry'}` : ''}.
• This analysis examines the relationship between "${query || 'General search'}" and ${INSIGHT_FOCUS_AREAS[focusArea].label} in change management.

Key Findings
• The relationship between "${query || 'General search'}" and ${INSIGHT_FOCUS_AREAS[focusArea].label} represents a critical dimension of change management that organisations must address effectively.
• Change initiatives involving "${query || 'General search'}" frequently encounter resistance at multiple organizational levels, requiring tailored ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches.
• Effective communication strategies are essential when addressing "${query || 'General search'}", with organisations needing to communicate 3-5 times more than initially anticipated to overcome resistance.
• Successful change implementation of "${query || 'General search'}" initiatives requires balancing technical solutions with ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches.
• Change readiness assessments before implementing "${query || 'General search'}" initiatives significantly increase success rates, with organisations using formal assessments reporting 2.5x greater change adoption.

Patterns & Implications
• Organisations frequently underestimate the cultural impact when implementing "${query || 'General search'}" changes, focusing primarily on processes while neglecting the emotional aspects that ${INSIGHT_FOCUS_AREAS[focusArea].label} addresses.
• Middle management acts as a critical "change bridge" between "${query || 'General search'}" strategy and execution, with their buy-in directly correlating to overall implementation success.
• "${query || 'General search'}" initiatives face unique challenges that require specialised ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches combining technical expertise with significant behavioral and cultural considerations.
• Change fatigue emerges as a recurring challenge in organisations undertaking multiple "${query || 'General search'}" initiatives simultaneously, affecting ${INSIGHT_FOCUS_AREAS[focusArea].label} effectiveness.

Practical Applications
• Develop comprehensive stakeholder mapping specifically for "${query || 'General search'}" initiatives, categorizing stakeholders by influence, interest, and potential impact with a focus on ${INSIGHT_FOCUS_AREAS[focusArea].label} considerations.
• Implement a multi-channel communication strategy for "${query || 'General search'}" that addresses both rational and emotional aspects of change, incorporating ${INSIGHT_FOCUS_AREAS[focusArea].label} best practices.
• Create a change champion network for "${query || 'General search'}" initiatives drawing representatives from different organisational levels to support ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches.
• Establish clear metrics for measuring both adoption rates and business outcomes of "${query || 'General search'}" initiatives, with regular review cycles to adjust ${INSIGHT_FOCUS_AREAS[focusArea].label} strategies.

Follow-up Questions
• What specific resistance patterns emerge when implementing "${query || 'General search'}" in different industry contexts, and how should ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches be adapted accordingly?
• How can organisations balance the pace of "${query || 'General search'}" implementation with the need for sustainable adoption through effective ${INSIGHT_FOCUS_AREAS[focusArea].label} practices?
• What ${INSIGHT_FOCUS_AREAS[focusArea].label} competencies are most crucial for navigating complex "${query || 'General search'}" change initiatives?
• How should ${INSIGHT_FOCUS_AREAS[focusArea].label} approaches differ between "${query || 'General search'}" technology-driven changes versus organisational restructuring?

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