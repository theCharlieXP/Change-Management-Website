import { NextResponse } from 'next/server'

// Add export config to bypass authentication middleware
export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    // Check environment variables
    console.log('Test endpoint environment:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('TAVILY_API_KEY available:', !!process.env.TAVILY_API_KEY);
    console.log('TAVILY_API_KEY mask:', process.env.TAVILY_API_KEY?.substring(0, 4) + '...');
    
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    
    if (!TAVILY_API_KEY) {
      return NextResponse.json({ 
        error: 'TAVILY_API_KEY is missing from environment variables',
        env_vars: Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY'))
      }, { status: 500 });
    }
    
    // First few characters of key for validation (masked for security)
    const keyStart = TAVILY_API_KEY.substring(0, 4) + '...';
    
    // Make a simple test request to Tavily
    try {
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
        })
      });
      
      console.log('Tavily test status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error(`Tavily test API error: Status ${response.status}, Response:`, errorText);
        return NextResponse.json({ 
          error: `Tavily API error: ${response.status}`,
          details: errorText,
          key_prefix: keyStart
        }, { status: response.status });
      }
      
      const data = await response.json();
      console.log('Tavily test success, results:', data.results?.length || 0);
      
      return NextResponse.json({
        success: true,
        status: response.status,
        key_prefix: keyStart,
        result_count: data.results?.length || 0,
        sample: data.results?.[0] ? {
          title: data.results[0].title,
          url: data.results[0].url
        } : null
      });
    } catch (error) {
      console.error('Tavily API direct call error:', error);
      return NextResponse.json({
        error: 'Error calling Tavily API directly',
        details: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n')
        } : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Error in test endpoint',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 