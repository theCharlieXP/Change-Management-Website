import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { summarizeWithDeepseek } from '@/lib/ai-utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightFocusArea } from '@/types/insights'

// Set proper runtime for compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check authentication
    const authData = await auth();
    const { userId  } = authData
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { insights, focusArea, format, searchInfo } = body

    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'No insights provided' }),
        { status: 400 }
      )
    }

    if (!focusArea || !INSIGHT_FOCUS_AREAS[focusArea as InsightFocusArea]) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid focus area' }),
        { status: 400 }
      )
    }

    // Prepare the content for summarization
    const content = insights.map(insight => `
Title: ${insight.title}
URL: ${insight.url}
${insight.content ? `Content: ${Array.isArray(insight.content) ? insight.content.join('\n') : insight.content}` : insight.summary ? `Content: ${insight.summary}` : ''}
`).join('\n---\n')

    // Generate the summary prompt based on the focus area
    const focusAreaInfo = INSIGHT_FOCUS_AREAS[focusArea as InsightFocusArea]
    
    // Extract search context
    const searchQuery = searchInfo?.query || '';
    const industryContext = searchInfo?.industries?.length > 0 
      ? `in the ${searchInfo.industries.join(', ')} ${searchInfo.industries.length > 1 ? 'industries' : 'industry'}`
      : '';
    
    // Use the format from the request if provided, otherwise use default
    const summaryFormat = format || {
      sections: [
        {
          title: "Context",
          description: "Exactly what was searched, focus area selected, and industries selected (if applicable)"
        },
        {
          title: "Insights",
          description: "7-10 comprehensive bullet points written by a change management expert"
        },
        {
          title: "References",
          description: "List of all sources with markdown links"
        }
      ],
      style: "Use clean markdown formatting with minimal excess text. Use bullet points (•) for Insights."
    }
    
    const prompt = `As a senior change management expert, analyze the following information and create a high-quality summary.

YOUR OUTPUT MUST FOLLOW THIS EXACT FORMAT:

# Title With Every First Letter Capitalized

## Insights
• First insight bullet point (complete sentence with expert analysis)
• Second insight bullet point
• Etc. (7-10 total bullet points)

## References
[Source Title 1](URL1)
[Source Title 2](URL2)
...

CRITICAL REQUIREMENTS - FOLLOW THESE EXACTLY:

1. TITLE FORMAT:
   - Begin with a single # followed by a space
   - CAPITALIZE THE FIRST LETTER OF EVERY WORD IN THE TITLE
   - Example: "# Strategic Approaches To Change Management Implementation"
   - Maximum 10 words

2. STRUCTURE:
   - Include ONLY a title, Insights section, and References section
   - DO NOT include a Context section - this is forbidden
   - DO NOT mention the search query or focus area except in your analysis

3. INSIGHTS SECTION:
   - Must contain exactly 7-10 detailed bullet points
   - Each bullet must start with the • symbol
   - Each bullet point must be a complete thought (40-60 words)
   - Write as a senior change management expert with 20+ years experience
   - Each insight must combine source information with expert knowledge
   - Each insight must include the "why it matters" or implications
   - Ensure insights are substantive, nuanced, and specifically relevant to ${searchQuery}
   - Write in professional UK English (organisation, centre, programme)
   - Insights must provide actionable value for change management practitioners
   - NEVER truncate sentences - all thoughts must be complete
   - DO NOT include bullet characters (·) at the end of sentences

4. REFERENCES:
   - List only clean markdown links: [Title](URL)
   - No descriptions after links
   - Include all sources provided

SEARCH CONTEXT (for your reference only, DO NOT include in output):
- Query: "${searchQuery}"
- Focus area: ${focusAreaInfo.label}${industryContext ? ` | Industries: ${industryContext}` : ''}

IMPORTANT WARNINGS:
- If you include a Context section, your work will be rejected
- If you don't capitalize the first letter of every word in the title, your work will be rejected
- If insights are generic, superficial, or truncated, your work will be rejected

Analyze these insights from Tavily search:

${content}`

    // Generate the summary using Deepseek
    let summary = await summarizeWithDeepseek(prompt, focusArea as InsightFocusArea)

    // Post-process the summary to ensure it meets formatting requirements
    summary = postProcessSummary(summary, focusAreaInfo.label, searchQuery)

    return new NextResponse(
      JSON.stringify({ summary }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating summary:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
}

/**
 * Post-processes the summary to ensure it meets all formatting requirements
 */
function postProcessSummary(summary: string, focusArea: string, searchQuery: string): string {
  // Split the summary into lines
  const lines = summary.split('\n')
  let processedLines: string[] = []
  let currentSection = ''
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Process the title
    if (line.startsWith('# ')) {
      // Capitalize first letter of each word in title
      const title = line.substring(2)
      const capitalizedTitle = title
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      processedLines.push(`# ${capitalizedTitle}`)
      continue
    }
    
    // Track current section
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).toLowerCase()
      
      // Skip Context section entirely
      if (currentSection === 'context') {
        // Skip until we find the next section
        while (i + 1 < lines.length && !lines[i + 1].startsWith('## ')) {
          i++
        }
        continue
      }
      
      processedLines.push(line)
      continue
    }
    
    // Process bullet points in Insights section
    if (currentSection === 'insights' && line.startsWith('• ')) {
      // Ensure bullet point doesn't end with "·"
      let bulletPoint = line
      if (bulletPoint.endsWith(' ·')) {
        bulletPoint = bulletPoint.substring(0, bulletPoint.length - 2) + '.'
      }
      
      // Ensure bullet point is a complete sentence ending with punctuation
      if (!/[.!?]$/.test(bulletPoint)) {
        bulletPoint += '.'
      }
      
      processedLines.push(bulletPoint)
      continue
    }
    
    // Add all other lines unchanged
    processedLines.push(line)
  }
  
  // If there's no title, add one
  if (!processedLines.some(line => line.startsWith('# '))) {
    const words = focusArea.split(' ')
      .concat(searchQuery.split(' '))
      .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicates
      .slice(0, 10) // Limit to 10 words
    
    const title = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    processedLines.unshift(`# ${title}`)
  }
  
  // Ensure there's no Context section
  if (!processedLines.includes('## Insights') && !processedLines.some(line => line.startsWith('## Insights'))) {
    // Find where to insert Insights section
    const titleIndex = processedLines.findIndex(line => line.startsWith('# '))
    if (titleIndex !== -1) {
      processedLines.splice(titleIndex + 1, 0, '', '## Insights')
    }
  }
  
  return processedLines.join('\n')
} 