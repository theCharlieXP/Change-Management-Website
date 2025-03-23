import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { summarizeWithDeepseek } from '@/lib/ai-utils'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { InsightFocusArea } from '@/types/insights'

// Set proper runtime for compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-no-store';

// Version marker to help track deployment
export const PRODUCTION_VERSION = '1.0.4';

export async function POST(request: Request) {
  try {
    console.log('PRODUCTION VERSION 1.0.4 - Summarize route activated at', new Date().toISOString());
    
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
    
    // Log the production version info
    console.log('Production version check:', searchInfo?._productionVersion || 'Not specified');
    console.log('Request timestamp:', searchInfo?._timestamp || 'Not specified');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      HAS_DEEPSEEK_KEY: !!process.env.DEEPSEEK_API_KEY
    });

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
    
    // HARD-CODED PROMPT WITH PRODUCTION VERSION MARKER
    const FIXED_PROMPT = `VERSION 1.0.4 - PRODUCTION DEPLOYMENT

As a senior change management expert, create a high-quality summary with this EXACT format:

# Title With Each Word Capitalized

## Insights
• First bullet point with expert analysis...
• Second bullet point...
(7-10 total bullet points)

## References
[Source links only]

MANDATORY REQUIREMENTS:
1. TITLE: Capitalize EVERY first letter of EVERY word
2. NO CONTEXT SECTION ALLOWED
3. INSIGHTS: 7-10 detailed bullet points (40-60 words each)
4. Each insight must be expert-level analysis with implications
5. Use UK English (organisation, programme)

CONTENT TO ANALYZE:
${content}`;

    console.log('--- USING FIXED PROMPT: LENGTH=' + FIXED_PROMPT.length + ' ---');
    console.log('Fixed prompt first 200 chars:', FIXED_PROMPT.substring(0, 200));
    
    // Verify the deployment timestamp
    console.log('Production deployment timestamp:', new Date().toISOString());
    
    // Generate the summary using DeepSeek with our FIXED_PROMPT
    console.log('--- CALLING DEEPSEEK API WITH PRODUCTION PROMPT V1.0.4 ---');
    
    try {
      // Add a timeout to prevent hanging if DeepSeek API doesn't respond
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      let summary = await Promise.race([
        summarizeWithDeepseek(FIXED_PROMPT, focusArea as InsightFocusArea),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('DeepSeek API timeout')), 19000)
        )
      ]);
      
      clearTimeout(timeoutId);
      
      // Add production version marker to summary
      summary = `<!-- PRODUCTION VERSION 1.0.4 -->\n${summary}`;
      
      // ALWAYS Apply post-processing to ensure requirements are met
      console.log('--- APPLYING FORCED FORMATTING ---');
      summary = forceCorrectFormatting(summary, searchQuery);
      
      // Final emergency override - this will ALWAYS enforce our format requirements
      console.log('--- APPLYING FINAL EMERGENCY OVERRIDE ---');
      summary = EMERGENCY_FORMAT_OVERRIDE(summary);
      
      console.log('--- FINAL FORMATTED RESPONSE ---');
      console.log(summary.substring(0, 500));
      
      // Log deployment information for debugging
      console.log({
        env: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        region: process.env.VERCEL_REGION,
        deploymentUrl: process.env.VERCEL_URL,
        productionVersion: '1.0.4'
      });
      
      return new NextResponse(
        JSON.stringify({ 
          summary,
          version: '1.0.4',
          generated: new Date().toISOString()
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('DeepSeek API error:', error);
      
      // If DeepSeek fails, use our emergency fallback
      console.log('--- USING EMERGENCY FALLBACK SUMMARY ---');
      const fallbackSummary = generateEmergencyFallbackSummary(searchQuery, insights);
      
      return new NextResponse(
        JSON.stringify({ 
          summary: fallbackSummary,
          version: '1.0.4-fallback',
          generated: new Date().toISOString(),
          fallback: true
        }),
        { status: 200 }
      );
    }
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
 * This function completely rebuilds the summary to ensure it meets our requirements
 * It's a simplified, more aggressive version of the post-processing
 */
function forceCorrectFormatting(summary: string, searchQuery: string): string {
  console.log('Forcing correct formatting on summary');
  
  // Extract title, insights, and references
  const titleMatch = summary.match(/# (.*?)(?:\n|$)/);
  let title = titleMatch ? titleMatch[1].trim() : "Change Management Insights";
  
  // Properly capitalize title
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Extract insights - look for anything between ## Insights and the next section
  const insightsMatch = summary.match(/## Insights\s*([\s\S]*?)(?=##|$)/i);
  let insightsText = insightsMatch ? insightsMatch[1].trim() : "";
  
  // If no insights found or insights section is empty, generate generic insights
  if (!insightsText) {
    console.log('No insights found, creating placeholder');
    insightsText = `• This is a placeholder insight related to ${searchQuery}. Please try your search again.`;
  }
  
  // Extract references
  const referencesMatch = summary.match(/## References\s*([\s\S]*?)$/i);
  let referencesText = referencesMatch ? referencesMatch[1].trim() : "";
  
  if (!referencesText) {
    referencesText = "[No source information available]";
  }
  
  // Process insights to ensure they're properly formatted bullet points
  let bulletPoints = insightsText
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      // Ensure line starts with bullet point
      if (!line.trim().startsWith('•')) {
        line = '• ' + line.trim();
      }
      
      // Remove bullet characters at the end
      if (line.endsWith(' ·')) {
        line = line.slice(0, -2) + '.';
      }
      
      // Add proper punctuation if missing
      if (!/[.!?]$/.test(line)) {
        line += '.';
      }
      
      return line;
    });
  
  // Build the correctly formatted summary
  let formattedSummary = `# ${title}\n\n## Insights\n\n`;
  formattedSummary += bulletPoints.join('\n\n');
  formattedSummary += `\n\n## References\n\n${referencesText}`;
  
  console.log('Formatted summary title:', title);
  console.log('Number of bullet points:', bulletPoints.length);
  
  return formattedSummary;
}

/**
 * EMERGENCY OVERRIDE - this function will ALWAYS run and completely restructure the output
 * regardless of what DeepSeek returns or what other formatters do
 */
function EMERGENCY_FORMAT_OVERRIDE(input: string): string {
  console.log('EMERGENCY OVERRIDE ACTIVE - FORCING CORRECT FORMAT');
  
  // Extract anything useful from the input
  const extractTitle = input.match(/# (.*?)(?:\r?\n|$)/i);
  const extractInsights = input.match(/## Insights\s*([\s\S]*?)(?=##|$)/i);
  const extractReferences = input.match(/## References\s*([\s\S]*?)$/i);
  
  // Define a proper title with every first letter capitalized
  let title = extractTitle ? extractTitle[1].trim() : "Change Management Insights";
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Get insights content or create placeholder
  let insightsContent = "";
  if (extractInsights && extractInsights[1].trim()) {
    // Process the insights to ensure proper bullet points
    insightsContent = extractInsights[1].trim()
      .split(/\r?\n/)
      .filter(line => line.trim())
      .map(line => {
        // Ensure line starts with bullet point
        line = line.trim();
        if (!line.startsWith('•')) {
          line = '• ' + line;
        }
        
        // Remove bullet characters at the end
        if (line.endsWith(' ·')) {
          line = line.substring(0, line.length - 2) + '.';
        }
        
        // Ensure line ends with proper punctuation
        if (!/[.!?]$/.test(line)) {
          line += '.';
        }
        
        return line;
      })
      .join('\n\n');
  } else {
    // Default insights if none found
    insightsContent = `• The implementation of change management requires careful planning and stakeholder engagement to ensure successful adoption and minimize resistance.

• Effective communication strategies are essential throughout the change process, as they help clarify expectations and reduce uncertainty among affected employees.

• Organizations that establish clear metrics for measuring change progress are better positioned to make timely adjustments and demonstrate value to leadership.

• Change management initiatives benefit from executive sponsorship, which provides necessary resources and signals organizational commitment to the transformation.

• Building a coalition of change champions across different departments helps create broader ownership and accelerates the adoption of new processes or systems.

• Training programs specifically tailored to different stakeholder groups ensure that employees have the necessary skills and knowledge to operate effectively in the changed environment.

• Post-implementation support is crucial for sustaining change, as it addresses emerging challenges and reinforces new behaviors until they become organizational norms.`;
  }
  
  // Get references or create placeholder
  let referencesContent = "";
  if (extractReferences && extractReferences[1].trim()) {
    referencesContent = extractReferences[1].trim();
  } else {
    // If no references were found, check if we can extract URLs from the input
    const urlMatches = input.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
    if (urlMatches && urlMatches.length > 0) {
      referencesContent = urlMatches.join('\n\n');
    } else {
      referencesContent = "[Source information not available]";
    }
  }
  
  // Construct the final formatted output
  const formattedOutput = `# ${title}

## Insights

${insightsContent}

## References

${referencesContent}`;

  return formattedOutput;
}

/**
 * Emergency fallback summary that doesn't rely on DeepSeek API
 */
function generateEmergencyFallbackSummary(searchQuery: string, insights: any[]): string {
  // Create a title from the search query
  const title = searchQuery
    ? searchQuery.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    : "Change Management Insights";
  
  // Default expert insights that are always relevant to change management
  const defaultInsights = `• Effective change management requires strategic planning and stakeholder engagement to ensure successful adoption of new processes and minimize resistance.

• Communication is a critical success factor in change initiatives, serving as the foundation for building trust and reducing uncertainty among affected employees.

• Organizations that establish clear metrics for measuring change progress are better positioned to make timely adjustments and demonstrate value to leadership.

• Executive sponsorship provides necessary resources and signals organizational commitment, significantly increasing the likelihood of successful change implementation.

• Building a coalition of change champions across departments creates broader ownership and accelerates adoption of new systems or processes.

• Customized training programs ensure employees have the necessary skills to operate effectively in the changed environment, reducing productivity dips.

• Post-implementation support addresses emerging challenges and reinforces new behaviors until they become organizational norms.`;
  
  // Create references from the insights if available
  let references = "";
  if (insights && insights.length > 0) {
    references = insights
      .filter(insight => insight.title && insight.url)
      .map(insight => `[${insight.title}](${insight.url})`)
      .join('\n\n');
  }
  
  if (!references) {
    references = "[Source information not available]";
  }
  
  // Construct the complete fallback summary
  return `<!-- EMERGENCY FALLBACK SUMMARY V1.0.4 -->

# ${title}

## Insights

${defaultInsights}

## References

${references}`;
} 