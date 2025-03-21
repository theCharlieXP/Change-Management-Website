import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Check environment variables
    console.log('Test endpoint environment:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('TAVILY_API_KEY available:', !!process.env.TAVILY_API_KEY);
    
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    
    if (!TAVILY_API_KEY) {
      return NextResponse.json({ 
        error: 'TAVILY_API_KEY is missing from environment variables',
        env_keys: Object.keys(process.env)
          .filter(key => !key.includes('SECRET') && !key.includes('KEY') && !key.includes('TOKEN'))
      }, { status: 500 });
    }
    
    // First few characters of key for validation (masked for security)
    const keyStart = TAVILY_API_KEY.substring(0, 4) + '...';
    
    // Make a simple test request to Tavily
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: 'test query',
        search_depth: 'basic',
        max_results: 1
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: `Tavily API error: ${response.status}`,
        details: errorText,
        key_prefix: keyStart
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      status: response.status,
      key_prefix: keyStart,
      result_count: data.results?.length || 0,
      sample_title: data.results?.[0]?.title || 'No results'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Error testing Tavily API',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 