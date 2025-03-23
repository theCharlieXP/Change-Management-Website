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
    
    console.log('--- GENERATING SUMMARY WITH THE FOLLOWING PARAMETERS ---');
    console.log('Focus Area:', focusAreaInfo.label);
    console.log('Search Query:', searchQuery);
    console.log('Number of insights:', insights.length);
    
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

    console.log('--- PROMPT CREATED (length: ' + prompt.length + ') ---');
    console.log('Prompt first 500 chars:', prompt.substring(0, 500));
    
    // Generate the summary using Deepseek
    console.log('--- CALLING DEEPSEEK API ---');
    let summary = await summarizeWithDeepseek(prompt, focusArea as InsightFocusArea)
    
    console.log('--- RAW DEEPSEEK RESPONSE ---');
    console.log(summary.substring(0, 500)); // Log the first 500 chars
    
    // Post-process the summary to ensure it meets formatting requirements
    console.log('--- APPLYING POST-PROCESSING ---');
    summary = postProcessSummary(summary, focusAreaInfo.label, searchQuery)
    
    console.log('--- POST-PROCESSED RESPONSE ---');
    console.log(summary.substring(0, 500)); // Log the first 500 chars
    
    // Apply one final dedicated formatter to ensure strict compliance
    console.log('--- APPLYING STRICT FORMATTER ---');
    summary = enforceStrictFormatting(summary)
    
    console.log('--- FINAL FORMATTED RESPONSE ---');
    console.log(summary.substring(0, 500)); // Log the first 500 chars

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
  console.log('Starting post-processing on summary of length:', summary.length);
  
  // Split the summary into lines
  const lines = summary.split('\n')
  let processedLines: string[] = []
  let currentSection = ''
  let hasTitle = false;
  let hasInsights = false;
  let hasReferences = false;
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line === '') {
      processedLines.push('');
      continue;
    }
    
    // Process the title
    if (line.startsWith('# ')) {
      hasTitle = true;
      
      // Capitalize first letter of each word in title
      const title = line.substring(2)
      const capitalizedTitle = title
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
      processedLines.push(`# ${capitalizedTitle}`)
      console.log('Processed title:', `# ${capitalizedTitle}`);
      continue
    }
    
    // Track current section
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).toLowerCase()
      console.log('Found section:', currentSection);
      
      // Skip Context section entirely
      if (currentSection === 'context') {
        console.log('Removing Context section');
        // Skip until we find the next section
        while (i + 1 < lines.length && !lines[i + 1].startsWith('## ')) {
          i++
        }
        continue
      }
      
      if (currentSection === 'insights') {
        hasInsights = true;
      } else if (currentSection === 'references') {
        hasReferences = true;
      }
      
      processedLines.push(`## ${currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}`);
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
  
  // If there's no title, create one
  if (!hasTitle) {
    console.log('No title found, creating one');
    const words = focusArea.split(' ')
      .concat(searchQuery.split(' '))
      .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicates
      .slice(0, 10) // Limit to 10 words
    
    const title = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    
    processedLines.unshift(`# ${title}`)
  }
  
  // Ensure we have an Insights section
  if (!hasInsights) {
    console.log('No Insights section found, creating one');
    // Find where to insert Insights section
    const titleIndex = processedLines.findIndex(line => line.startsWith('# '))
    const insertIndex = titleIndex !== -1 ? titleIndex + 2 : 0
    processedLines.splice(insertIndex, 0, '## Insights', '')
  }
  
  // Ensure we have a References section
  if (!hasReferences) {
    console.log('No References section found, creating one');
    processedLines.push('', '## References', '[Source information not available]')
  }
  
  // Do a final check for Context section - this is a failsafe
  const result = processedLines.join('\n')
  if (result.includes('## Context') || result.match(/##\s+Context/i)) {
    console.log('Context section found in final check, removing it');
    return result
      .replace(/##\s+Context\s*\n[\s\S]*?(##|$)/i, '$1')
      .replace(/\n{3,}/g, '\n\n'); // Fix excess newlines
  }
  
  return result
}

/**
 * Enforces strict formatting rules on the summary
 * This is a last resort to ensure the summary meets our requirements
 */
function enforceStrictFormatting(summary: string): string {
  // Extract sections from the summary
  const titleMatch = summary.match(/# (.*?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1] : "Change Management Insights";
  
  // Find Insights section - capture everything between ## Insights and the next ## or end of string
  const insightsMatch = summary.match(/## Insights\s*([\s\S]*?)(?=##|$)/);
  let insights = insightsMatch ? insightsMatch[1].trim() : "";
  
  // Find References section - capture everything after ## References
  const referencesMatch = summary.match(/## References\s*([\s\S]*?)$/);
  let references = referencesMatch ? referencesMatch[1].trim() : "";
  
  // Capitalize title words
  const capitalizedTitle = title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Process insights to ensure they're bullet points
  let bulletPoints = insights.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      // Ensure line starts with bullet point
      if (!line.startsWith('•')) {
        line = '• ' + line;
      }
      
      // Ensure proper punctuation at the end
      if (!/[.!?]$/.test(line)) {
        line = line + '.';
      }
      
      // Remove bullet characters at the end
      if (line.endsWith(' ·')) {
        line = line.slice(0, -2) + '.';
      }
      
      return line;
    });
  
  // Compile the formatted summary
  let formattedSummary = `# ${capitalizedTitle}\n\n## Insights\n\n`;
  
  // Add bullet points
  formattedSummary += bulletPoints.join('\n\n');
  
  // Add references section
  formattedSummary += `\n\n## References\n\n${references || '[Source information not available]'}`;
  
  return formattedSummary;
} 