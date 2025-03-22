import { NextResponse } from 'next/server'

// Set proper runtime for Prisma compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Start time for performance tracking
    const startTime = Date.now()
    console.log('Test Tavily API request received at', new Date().toISOString())
    
    // Get the Tavily API key from environment variables
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY
    const keyStart = TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 8) : 'NOT_FOUND'
    
    // Debug environment info
    console.log('Environment info:', {
      node_env: process.env.NODE_ENV,
      tavily_key_exists: !!TAVILY_API_KEY,
      tavily_key_length: TAVILY_API_KEY?.length || 0,
      tavily_key_prefix: keyStart
    })
    
    if (!TAVILY_API_KEY) {
      console.error('TAVILY_API_KEY is not configured in environment variables')
      return NextResponse.json({
        error: 'Tavily API key is not configured',
        environment: process.env.NODE_ENV,
        key_status: 'missing'
      }, { status: 500 })
    }
    
    if (!TAVILY_API_KEY.startsWith('tvly-')) {
      console.warn('TAVILY_API_KEY may be invalid - does not start with expected prefix "tvly-"')
    }
    
    // Make a simple test request to Tavily with timeout handling
    try {
      // Add a timeout to the fetch request
      const fetchTimeoutMs = 15000 // 15 seconds
      const controller = new AbortController()
      const signal = controller.signal
      
      const timeout = setTimeout(() => {
        controller.abort()
        console.error(`Fetch request to Tavily API timed out after ${fetchTimeoutMs}ms`)
      }, fetchTimeoutMs)
      
      console.log('Initiating Tavily API test request')
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TAVILY_API_KEY}`
        },
        body: JSON.stringify({
          query: 'test query for change management',
          search_depth: 'basic',
          max_results: 1
        }),
        signal
      }).finally(() => clearTimeout(timeout))
      
      console.log('Tavily test status:', response.status)
      const responseTime = Date.now() - startTime
      
      if (!response.ok) {
        let errorText
        try {
          errorText = await response.text()
        } catch (readError) {
          errorText = 'Could not read error response'
          console.error('Error reading response text:', readError)
        }
        
        console.error(`Tavily test API error: Status ${response.status}, Response:`, errorText)
        return NextResponse.json({ 
          error: `Tavily API error: ${response.status}`,
          details: errorText,
          key_prefix: keyStart,
          response_time_ms: responseTime,
          environment: process.env.NODE_ENV
        }, { status: response.status })
      }
      
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Error parsing Tavily API response as JSON:', jsonError)
        return NextResponse.json({
          error: 'Failed to parse Tavily API response',
          details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error',
          key_prefix: keyStart,
          response_time_ms: responseTime,
          environment: process.env.NODE_ENV
        }, { status: 500 })
      }
      
      console.log('Tavily test success, results:', data.results?.length || 0)
      
      return NextResponse.json({
        success: true,
        status: response.status,
        key_prefix: keyStart,
        response_time_ms: responseTime,
        environment: process.env.NODE_ENV,
        result_count: data.results?.length || 0,
        sample: data.results?.[0] ? {
          title: data.results[0].title,
          url: data.results[0].url
        } : null
      })
    } catch (error) {
      console.error('Tavily API direct call error:', error)
      const isTimeout = error instanceof DOMException && error.name === 'AbortError'
      
      return NextResponse.json({
        error: isTimeout ? 'Tavily API request timed out' : 'Error calling Tavily API directly',
        details: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          is_timeout: isTimeout
        } : String(error),
        key_prefix: keyStart,
        response_time_ms: Date.now() - startTime,
        environment: process.env.NODE_ENV
      }, { status: isTimeout ? 504 : 500 })
    }
  } catch (error) {
    console.error('Top-level error in test-tavily API:', error)
    return NextResponse.json({
      error: 'Unexpected error in test-tavily endpoint',
      details: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      } : String(error),
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
} 