import { NextResponse } from 'next/server'

// Define an interface for the Tavily test result
interface TavilyTestResult {
  status?: number;
  ok?: boolean;
  resultCount?: number;
  parseError?: string;
  errorText?: string;
  error?: string;
  stack?: string | null;
}

// Use the modern route segment config approach instead of the deprecated "export const config"
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Remove the deprecated config
// export const config = {
//   api: {
//     bodyParser: true,
//   },
// }

// A simple debug endpoint to check environment variables
export async function GET(request: Request) {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  
  // Test the Tavily API directly
  let tavilyTestResult: TavilyTestResult | null = null;
  
  try {
    if (TAVILY_API_KEY) {
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
      
      const responseStatus = response.status;
      const responseOk = response.ok;
      
      tavilyTestResult = {
        status: responseStatus,
        ok: responseOk
      };
      
      if (responseOk) {
        try {
          const data = await response.json();
          tavilyTestResult.resultCount = data.results?.length || 0;
        } catch (e) {
          tavilyTestResult.parseError = e instanceof Error ? e.message : String(e);
        }
      } else {
        tavilyTestResult.errorText = await response.text().catch(() => 'Could not read error response');
      }
    }
  } catch (e) {
    tavilyTestResult = {
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split('\n').slice(0, 3).join('\n') : null
    };
  }
  
  const debugInfo = {
    environment: process.env.NODE_ENV,
    tavily_api_key_exists: !!TAVILY_API_KEY,
    tavily_api_key_prefix: TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 8) + '...' : 'N/A',
    tavily_api_key_length: TAVILY_API_KEY ? TAVILY_API_KEY.length : 0,
    // Test direct API call
    tavily_test_result: tavilyTestResult,
    // List of environment variables without sensitive information
    all_env_keys: Object.keys(process.env).filter(key => 
      !key.includes('SECRET') && 
      !key.includes('KEY') && 
      !key.includes('TOKEN') && 
      !key.includes('PASSWORD')).sort(),
    request_headers: Object.fromEntries(
      Array.from(request.headers.entries())
        .filter(([key]) => !key.includes('cookie') && !key.includes('auth'))
    )
  }

  return NextResponse.json(debugInfo)
} 