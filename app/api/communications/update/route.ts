import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    // Check authentication
    const authData = await auth();
const { userId  } = authData
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { message, currentCommunication } = body

    if (!message || !currentCommunication) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Check if DeepSeek API key is configured
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      console.error('DeepSeek API key is not configured');
      return NextResponse.json(
        { error: 'DeepSeek API key is not configured' },
        { status: 500 }
      )
    }

    // Call DeepSeek API to update the communication
    const updatedCommunication = await callDeepSeekAPI(message, currentCommunication, apiKey)

    // Generate a response message based on the user's request
    const responseMessage = generateResponseMessage(message)

    return NextResponse.json({
      updatedCommunication,
      response: responseMessage
    })

  } catch (error) {
    console.error('[COMMUNICATIONS_UPDATE_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Function to call DeepSeek API
async function callDeepSeekAPI(message: string, currentCommunication: string, apiKey: string) {
  console.log('Calling DeepSeek API for communication update...');
  
  // Construct the system message
  const systemMessage = `You are an expert in change management communications. 
  Your task is to update the provided communication based on the user's request.
  
  IMPORTANT FORMATTING INSTRUCTIONS:
  1. DO NOT use Markdown formatting like hashtags (#), asterisks (*), or underscores (_) for emphasis.
  2. Use plain text formatting only.
  3. For headings, simply use capitalization or write "Heading:" at the beginning of the line.
  4. For emphasis, use capitalization or simply structure your sentences to emphasize important points.
  5. For bullet points, use standard bullet point format with a dash (-) or bullet (•) followed by a space.
  6. For numbered lists, use standard number format (1., 2., etc.).
  7. Keep the formatting clean, professional, and easy to read.
  
  INSTRUCTIONS:
  1. Carefully read the current communication.
  2. Understand the user's request for changes.
  3. Make ONLY the requested changes while preserving the overall message and purpose.
  4. Return the complete updated communication.
  5. Do not add any explanations or comments about the changes - just return the updated text.
  
  REMEMBER: The output should be a complete, ready-to-use communication that incorporates the requested changes.`

  // Construct the user message
  const userMessage = `
CURRENT COMMUNICATION:
${currentCommunication}

REQUESTED CHANGES:
${message}

Please update the communication based on these requested changes. Return only the updated communication text.`

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

    if (!response.ok) {
      let errorMessage = `DeepSeek API error: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error('DeepSeek API error response:', errorText);
        errorMessage = `DeepSeek API error: ${errorText}`;
      } catch (e) {
        console.error('Failed to read error response text:', e);
      }
      
      throw new Error(errorMessage);
    }

    console.log('DeepSeek API response received successfully');
    const data = await response.json();
    
    // Extract the content from the response
    const content = data.choices[0].message.content;
    return content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
}

// Function to generate a response message based on the user's request
function generateResponseMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('concise') || lowerMessage.includes('shorter') || lowerMessage.includes('brief')) {
    return "I've made the communication more concise while preserving the key points. Let me know if you'd like it even shorter.";
  }
  
  if (lowerMessage.includes('formal')) {
    return "I've adjusted the tone to be more formal and professional. Let me know if it meets your expectations.";
  }
  
  if (lowerMessage.includes('casual') || lowerMessage.includes('friendly')) {
    return "I've made the communication more casual and friendly. Let me know if you'd like any further adjustments.";
  }
  
  if (lowerMessage.includes('bullet') || lowerMessage.includes('list')) {
    return "I've reformatted the content using bullet points for better readability. Let me know if you'd like any changes to the structure.";
  }
  
  if (lowerMessage.includes('emphasize') || lowerMessage.includes('highlight')) {
    return "I've emphasized the key points as requested. Let me know if you'd like to highlight anything else.";
  }
  
  // Default response
  return "I've updated the communication based on your request. Take a look at the changes and let me know if you'd like any further adjustments.";
} 