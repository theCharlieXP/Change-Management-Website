import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('API route called: /api/communications/generate');
    
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      console.error('DeepSeek API key is not configured');
      return NextResponse.json(
        { error: 'DeepSeek API key is not configured' },
        { status: 500 }
      )
    }

    // Parse the request body
    const requestData = await request.json()
    console.log('Request data received, processing...');
    
    const { 
      prompt, 
      insightsContent, 
      highlightedPoints,
      title,
      audience,
      tone,
      style,
      detailLevel,
      formatting,
      mandatoryPoints,
      callToAction,
      customTerminology,
      additionalContext,
      additionalInstructions,
      referenceDocuments,
      changedSettings = [] // New parameter to track changes
    } = requestData

    // Validate required fields
    if (!prompt) {
      console.error('Missing required field: prompt');
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 }
      )
    }

    // Prepare the audience and tone mapping
    const audienceMap = {
      'all-employees': 'all employees',
      'management': 'management team',
      'specific-team': 'specific team/department'
    }
    
    const toneMap = {
      'formal': 'formal and professional',
      'casual': 'friendly and engaging',
      'motivational': 'concise and direct'
    }

    // Add reference documents info
    const referenceDocumentsInfo = referenceDocuments && referenceDocuments.length > 0 
      ? `REFERENCE DOCUMENTS:\n${referenceDocuments.map((file: any) => file.name).join('\n')}\n\nThe content of these documents has been analyzed and should be used for context and terminology.` 
      : '';

    // Create specific instructions based on changed settings
    let changeInstructions = '';
    if (changedSettings && changedSettings.length > 0) {
      changeInstructions = `
IMPORTANT - THE FOLLOWING SETTINGS HAVE BEEN CHANGED:
${changedSettings.join('\n')}

Based on these changes, please adjust the communication accordingly. Specifically:
- If the detail level was changed to "Brief", make the communication more concise while preserving the key points.
- If the detail level was changed to "Detailed", expand on the key points with more information and context.
- If the style was changed, adapt the structure to match the new style (narrative, bullet points, or mixed).
- If the tone was changed, adjust the language and phrasing to match the new tone.
- If the formatting was changed, restructure the content to match the new formatting preference.
- If mandatory points were changed, ensure all new points are included prominently.
- If the audience was changed, adapt the language and content to be appropriate for the new audience.

MAINTAIN THE SAME CORE CONTENT AND KEY MESSAGES, just adapt the presentation based on the changes.
`;
    }

    // Construct the system message
    const systemMessage = `You are an expert in change management communications. 
    Your task is to create professional, well-structured communications based on the provided insights and requirements.
    Focus on clarity, impact, and addressing the specific needs of the target audience.
    
    IMPORTANT FORMATTING INSTRUCTIONS:
    1. DO NOT use Markdown formatting like hashtags (#), asterisks (*), or underscores (_) for emphasis.
    2. Use plain text formatting only.
    3. For headings, simply use capitalization or write "Heading:" at the beginning of the line.
    4. For emphasis, use capitalization or simply structure your sentences to emphasize important points.
    5. For bullet points, use standard bullet point format with a dash (-) or bullet (•) followed by a space.
    6. For numbered lists, use standard number format (1., 2., etc.).
    7. Keep the formatting clean, professional, and easy to read.
    
    DETAIL LEVEL GUIDELINES:
    - Brief (0-33): Keep the communication concise and to the point. Focus only on the most essential information. Aim for 30% shorter than standard.
    - Standard (34-66): Provide a balanced amount of detail. Include key points with some supporting information.
    - Detailed (67-100): Provide comprehensive information with more context, examples, and explanations. Aim for 30% more content than standard.
    
    STYLE GUIDELINES:
    - Narrative: Use flowing paragraphs with clear transitions between ideas.
    - Bullet Points: Use concise bullet points for key information.
    - Mixed: Use a combination of paragraphs for context and bullet points for key takeaways.
    
    FORMATTING GUIDELINES:
    - Paragraphs: Use primarily paragraph format with clear structure.
    - Bullets: Use primarily bullet points for a scannable format.
    - Numbered: Use primarily numbered lists for sequential information.
    - Mixed: Use a combination based on the content needs.`

    // Construct the user message with all the customization details
    const userMessage = `
${prompt}

${changeInstructions}

TITLE/HEADLINE: ${title || 'Use an appropriate title based on the content'}

INSIGHTS TO INCLUDE:
${insightsContent}

IMPORTANT: For each insight, prioritise and emphasize the highlighted key points in the generated communication.
${highlightedPoints ? `\nHIGHLIGHTED KEY POINTS:\n${highlightedPoints}` : ''}

TARGET AUDIENCE: ${audienceMap[audience as keyof typeof audienceMap] || 'all employees'}

TONE: ${toneMap[tone as keyof typeof toneMap] || 'formal and professional'}

STYLE: ${style === 'narrative' ? 'Use flowing paragraphs' : style === 'bullet-points' ? 'Use concise bullet points' : 'Use a mix of paragraphs and bullet points'}

DETAIL LEVEL: ${detailLevel < 33 ? 'Brief overview - be concise and focus only on essential information' : 
  detailLevel < 66 ? 'Standard detail - balanced amount of information' : 
  'In-depth explanation - provide comprehensive information with context and examples'}

FORMATTING: ${formatting === 'paragraphs' ? 'Primarily use paragraphs' : 
  formatting === 'bullets' ? 'Primarily use bullet points' : 
  formatting === 'numbered' ? 'Primarily use numbered lists' : 
  'Use a mix of paragraphs and lists as appropriate'}

${mandatoryPoints ? `MANDATORY POINTS TO INCLUDE:\n${mandatoryPoints}` : ''}

${callToAction ? `CALL TO ACTION:\n${callToAction}` : ''}

${customTerminology ? `CUSTOM TERMINOLOGY/BRANDING:\n${customTerminology}` : ''}

${additionalContext ? `CONTEXT AND BACKGROUND:\n${additionalContext}` : ''}

${additionalInstructions ? `ADDITIONAL INSTRUCTIONS:\n${additionalInstructions}` : ''}

${referenceDocumentsInfo}

REMEMBER: Do not use Markdown formatting like hashtags (#), asterisks (*), or underscores (_). Use plain text formatting only.

Please generate a complete, well-structured communication that addresses all the requirements above.
`

    console.log('Calling DeepSeek API...');
    
    try {
      // Call the DeepSeek API
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
              content: systemMessage
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7,
        }),
      })

      console.log('DeepSeek API response status:', response.status);

      if (!response.ok) {
        let errorMessage = `DeepSeek API error: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.error('DeepSeek API error response:', errorText);
          errorMessage = `DeepSeek API error: ${errorText}`;
        } catch (e) {
          console.error('Failed to read error response text:', e);
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        )
      }

      const result = await response.json();
      console.log('DeepSeek API response received successfully');
      
      let generatedContent = result.choices[0].message.content;

      // Clean up any remaining Markdown formatting
      generatedContent = generatedContent
        // Replace Markdown headings (# Heading) with plain text headings
        .replace(/^#+\s+(.+)$/gm, 'HEADING: $1')
        // Replace Markdown bold (**text**) with plain text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        // Replace Markdown italic (*text*) with plain text
        .replace(/\*(.+?)\*/g, '$1')
        // Replace Markdown underline (_text_) with plain text
        .replace(/_(.+?)_/g, '$1')
        // Ensure bullet points are consistent
        .replace(/^\s*[*-]\s+/gm, '• ')
        // Ensure numbered lists are consistent
        .replace(/^\s*(\d+)\.\s+/gm, '$1. ');

      return NextResponse.json({ content: generatedContent });
    } catch (apiError: any) {
      console.error('Error calling DeepSeek API:', apiError);
      return NextResponse.json(
        { error: `Error calling DeepSeek API: ${apiError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error generating communication:', error);
    return NextResponse.json(
      { error: `Failed to generate communication: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 