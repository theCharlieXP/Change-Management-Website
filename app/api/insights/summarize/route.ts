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
export const PRODUCTION_VERSION = '1.0.5';

export async function POST(request: Request) {
  try {
    console.log('PRODUCTION VERSION 1.0.5 - Summarize route activated at', new Date().toISOString());
    
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
    const FIXED_PROMPT = `CRITICAL: FOLLOW THESE INSTRUCTIONS EXACTLY

Your task is to create a change management summary in markdown format with THESE EXACT SECTIONS:

# Title With First Letter Of Each Word Capitalized

## Insights
• First bullet point (40-60 words of expert analysis)
• Second bullet point
• Third bullet point
(Continue with 7-10 detailed bullet points total)

## References
[Source links]

YOU MUST FOLLOW THESE FORMATTING RULES:
1. TITLE: Every Word Must Start With A Capital Letter
2. DO NOT CREATE A CONTEXT SECTION - THIS IS FORBIDDEN
3. INSIGHTS: Use "•" character (not "-" or "*") for 7-10 bullet points
4. REFERENCES: List source links only

EXAMPLE OF CORRECT FORMAT:
# Implementing Digital Transformation In Healthcare

## Insights
• Healthcare organizations must develop comprehensive change management strategies that address both technical implementation and cultural adaptation to ensure successful digital transformation.
• Executive sponsorship is crucial for driving adoption of new digital tools, providing necessary resources and signaling organizational commitment to the transformation effort.
• etc.

## References
[Digital Transformation in Healthcare](https://example.com)
[Change Management Best Practices](https://example.com)

CONTENT TO ANALYZE:
${content}`;

    console.log('--- USING FIXED PROMPT: LENGTH=' + FIXED_PROMPT.length + ' ---');
    console.log('Fixed prompt first 200 chars:', FIXED_PROMPT.substring(0, 200));
    
    // Verify the deployment timestamp
    console.log('Production deployment timestamp:', new Date().toISOString());
    
    // Generate the summary using DeepSeek with our FIXED_PROMPT
    console.log('--- CALLING DEEPSEEK API WITH PRODUCTION PROMPT V1.0.5 ---');
    
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
      summary = `<!-- PRODUCTION VERSION 1.0.5 -->\n${summary}`;
      
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
        productionVersion: '1.0.5'
      });
      
      return new NextResponse(
        JSON.stringify({ 
          summary,
          version: '1.0.5',
          generated: new Date().toISOString()
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('DeepSeek API error:', error);
      
      // If DeepSeek fails, use our emergency fallback
      console.log('--- USING EMERGENCY FALLBACK SUMMARY ---');
      const fallbackSummary = generateEmergencyFallbackSummary(searchQuery, insights);
      
      // Apply EMERGENCY_FORMAT_OVERRIDE to the fallback summary as well for consistency
      const finalFallbackSummary = EMERGENCY_FORMAT_OVERRIDE(fallbackSummary);
      
      return new NextResponse(
        JSON.stringify({ 
          summary: finalFallbackSummary,
          version: '1.0.5-fallback',
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
 * Last-resort formatting to ensure the output meets our requirements
 * This function is called after all other formatters and ensures that:
 * 1. Title is properly capitalized
 * 2. No Context section exists
 * 3. Bullet points use the correct character
 */
function EMERGENCY_FORMAT_OVERRIDE(input: string): string {
  console.log('Applying EMERGENCY_FORMAT_OVERRIDE to ensure proper formatting');
  
  // Extract each section
  const sections: Record<string, string> = {};
  
  // 1. Extract title
  const titleMatch = input.match(/# (.*?)($|\n)/);
  let title = titleMatch ? titleMatch[1].trim() : "Change Management Insights";
  
  // Ensure title uses proper capitalization
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // 2. Check and remove Context section if it exists
  if (input.includes('## Context') || input.includes('## Background') || input.includes('## Overview')) {
    console.log('EMERGENCY: Context section detected - removing it');
    input = input.replace(/##\s*(Context|Background|Overview)[\s\S]*?(##|$)/, '$2');
  }
  
  // 3. Extract insights section
  const insightsMatch = input.match(/## Insights\s*([\s\S]*?)(?=##|$)/i);
  let insightsText = '';
  
  if (insightsMatch && insightsMatch[1].trim()) {
    // Process bullet points for insights
    const points = insightsMatch[1].trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Format each bullet point correctly
    const formattedPoints = points.map(point => {
      // Ensure it starts with • character
      if (!point.startsWith('•')) {
        // Replace any other bullet characters
        point = point.replace(/^[-*]\s*/, '');
        point = '• ' + point;
      }
      
      // Make sure it ends with proper punctuation
      if (!/[.!?]$/.test(point)) {
        point += '.';
      }
      
      return point;
    });
    
    insightsText = formattedPoints.join('\n\n');
  } else {
    // If no insights section found, create default bullets
    insightsText = `• Effective change management requires strategic planning and stakeholder engagement to ensure successful adoption of new processes and minimize resistance.

• Communication is a critical success factor in change initiatives, serving as the foundation for building trust and reducing uncertainty among affected employees.

• Organizations that establish clear metrics for measuring change progress are better positioned to make timely adjustments and demonstrate value to leadership.

• Executive sponsorship provides necessary resources and signals organizational commitment, significantly increasing the likelihood of successful change implementation.

• Building a coalition of change champions across departments creates broader ownership and accelerates adoption of new systems or processes.

• Customized training programs ensure employees have the necessary skills to operate effectively in the changed environment, reducing productivity dips.

• Post-implementation support addresses emerging challenges and reinforces new behaviors until they become organizational norms.`;
  }
  
  // 4. Extract references section
  const referencesMatch = input.match(/## References\s*([\s\S]*?)(?=##|$)/i);
  let referencesText = '';
  
  if (referencesMatch && referencesMatch[1].trim()) {
    referencesText = referencesMatch[1].trim();
  } else {
    // Look for any links in the text
    const links = input.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
    if (links && links.length > 0) {
      referencesText = links.join('\n\n');
    } else {
      referencesText = '[Source information not available]';
    }
  }
  
  // 5. Reconstruct the formatted output with only the sections we want
  const formattedOutput = `<!-- EMERGENCY OVERRIDE V1.0.5 -->

# ${title}

## Insights

${insightsText}

## References

${referencesText}`;

  console.log('EMERGENCY FORMAT OVERRIDE complete');
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