import { NextResponse } from 'next/server'

// Set proper runtime for API compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Start time for performance tracking
    const startTime = Date.now()
    console.log('Test DeepSeek API request received at', new Date().toISOString())
    
    // Get the DeepSeek API key from environment variables
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
    
    // Mask the key for security when logging
    const maskedKey = DEEPSEEK_API_KEY 
      ? `${DEEPSEEK_API_KEY.substring(0, 4)}...${DEEPSEEK_API_KEY.substring(DEEPSEEK_API_KEY.length - 4)}`
      : 'NOT_FOUND'
    
    // Debug environment info
    console.log('Environment info:', {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
      deepseek_key_exists: !!DEEPSEEK_API_KEY,
      deepseek_key_length: DEEPSEEK_API_KEY?.length || 0,
      deepseek_key_preview: maskedKey
    })
    
    // Log all environment variables (without values for security)
    const envVarNames = Object.keys(process.env).sort()
    console.log('Available environment variables:', envVarNames)
    
    if (!DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not configured in environment variables')
      return NextResponse.json({
        error: 'DeepSeek API key is not configured',
        environment: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
        key_status: 'missing',
        available_env_vars: envVarNames
      }, { status: 500 })
    }
    
    // Make a simple test request to DeepSeek API with timeout handling
    try {
      // Add a timeout to the fetch request
      const fetchTimeoutMs = 15000 // 15 seconds
      const controller = new AbortController()
      const signal = controller.signal
      
      const timeout = setTimeout(() => {
        controller.abort()
        console.error(`Fetch request to DeepSeek API timed out after ${fetchTimeoutMs}ms`)
      }, fetchTimeoutMs)
      
      console.log('Initiating DeepSeek API test request')
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
              content: 'You are a helpful assistant.'
            },
            {
              role: 'user',
              content: 'Testing the DeepSeek API with a simple response: what is change management?'
            }
          ],
          temperature: 0.1,
          max_tokens: 100
        }),
        signal
      }).finally(() => clearTimeout(timeout))
      
      console.log('DeepSeek test status:', response.status)
      const responseTime = Date.now() - startTime
      
      if (!response.ok) {
        let errorText
        try {
          errorText = await response.text()
        } catch (readError) {
          errorText = 'Could not read error response'
          console.error('Error reading response text:', readError)
        }
        
        console.error(`DeepSeek test API error: Status ${response.status}, Response:`, errorText)
        return NextResponse.json({ 
          error: `DeepSeek API error: ${response.status}`,
          details: errorText,
          key_preview: maskedKey,
          response_time_ms: responseTime,
          environment: process.env.NODE_ENV,
          vercel_env: process.env.VERCEL_ENV
        }, { status: response.status })
      }
      
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Error parsing DeepSeek API response as JSON:', jsonError)
        return NextResponse.json({
          error: 'Failed to parse DeepSeek API response',
          details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error',
          key_preview: maskedKey,
          response_time_ms: responseTime,
          environment: process.env.NODE_ENV,
          vercel_env: process.env.VERCEL_ENV
        }, { status: 500 })
      }
      
      console.log('DeepSeek test success')
      
      return NextResponse.json({
        success: true,
        status: response.status,
        key_preview: maskedKey,
        response_time_ms: responseTime,
        environment: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
        response_content: data.choices?.[0]?.message?.content || null
      })
    } catch (error) {
      console.error('DeepSeek API direct call error:', error)
      const isTimeout = error instanceof DOMException && error.name === 'AbortError'
      
      return NextResponse.json({
        error: isTimeout ? 'DeepSeek API request timed out' : 'Error calling DeepSeek API directly',
        details: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          is_timeout: isTimeout
        } : String(error),
        key_preview: maskedKey,
        response_time_ms: Date.now() - startTime,
        environment: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV
      }, { status: isTimeout ? 504 : 500 })
    }
  } catch (error) {
    console.error('Top-level error in test-deepseek API:', error)
    return NextResponse.json({
      error: 'Unexpected error in test-deepseek endpoint',
      details: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      } : String(error),
      environment: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV
    }, { status: 500 })
  }
} 