import { NextResponse } from 'next/server'
import { directDeepSeekQuery } from '@/lib/ai-utils'

// Set proper runtime for API compatibility
export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for API calls

/**
 * Custom prompt API endpoint
 * This allows sending a completely custom prompt to DeepSeek
 * without any post-processing of the response
 */
export async function POST(request: Request) {
  try {
    console.log('Custom prompt request received at', new Date().toISOString())
    
    // Parse the request body
    const body = await request.json()
    
    // Extract the custom prompt and content
    const { customPrompt, content } = body
    
    // Validate inputs
    if (!customPrompt) {
      return NextResponse.json({ 
        error: 'Missing required parameter: customPrompt',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    if (!content) {
      return NextResponse.json({ 
        error: 'Missing required parameter: content',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    console.log('Custom prompt length:', customPrompt.length)
    console.log('Content length:', content.length)
    
    // Make the direct API call
    console.log('Making direct DeepSeek API call with custom prompt')
    const result = await directDeepSeekQuery(customPrompt, content)
    
    // Return the raw result
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    })
    
  } catch (error) {
    console.error('Error in custom-prompt API:', error)
    return NextResponse.json({
      error: 'Failed to process custom prompt request',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 