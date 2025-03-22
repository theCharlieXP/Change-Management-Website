import { NextResponse } from 'next/server'

// Set proper runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  try {
    // Get the Tavily API key
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || 'change management'
    const debug = searchParams.get('debug') === 'true'
    
    console.log('Basic search request:', { query, debug })
    
    // Debug mode returns API key info without making API call
    if (debug) {
      return NextResponse.json({
        debug: true,
        apiKey: {
          exists: !!TAVILY_API_KEY,
          prefix: TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 8) : null,
          length: TAVILY_API_KEY?.length || 0,
          valid_format: TAVILY_API_KEY?.startsWith('tvly-')
        },
        environment: process.env.NODE_ENV,
        time: new Date().toISOString()
      })
    }
    
    // Validate API key
    if (!TAVILY_API_KEY) {
      console.error('TAVILY_API_KEY missing')
      return NextResponse.json({ error: 'Search service not configured' }, { status: 500 })
    }
    
    // Make direct API call to Tavily
    try {
      console.log('Making direct Tavily API call')
      
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TAVILY_API_KEY}`
        },
        body: JSON.stringify({
          query: query,
          search_depth: 'basic',
          max_results: 5
        })
      })
      
      console.log('Tavily response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Tavily error:', response.status, errorText)
        return NextResponse.json(
          { error: `Search API error (${response.status})`, details: errorText },
          { status: response.status }
        )
      }
      
      const data = await response.json()
      console.log('Tavily success, results count:', data.results?.length || 0)
      
      return NextResponse.json({
        results: data.results || [],
        result_count: data.results?.length || 0
      })
      
    } catch (error) {
      console.error('Error calling Tavily:', error)
      return NextResponse.json(
        { error: 'Search service error', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Top-level error in search-basic:', error)
    return NextResponse.json(
      { error: 'Unexpected error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 