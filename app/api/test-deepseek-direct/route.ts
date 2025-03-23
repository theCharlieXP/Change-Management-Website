import { NextResponse } from 'next/server'

// Set proper runtime for API compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'default-no-store'

export async function GET(request: Request) {
  try {
    console.log('Direct DeepSeek API test request received at', new Date().toISOString())
    
    // NOTE: This endpoint is just for testing and uses a hardcoded key
    // You should replace this with your actual key during testing, then remove it
    // immediately. Never commit API keys to your repository.
    const HARDCODED_KEY = "" // IMPORTANT: Add your key here for testing, then REMOVE it!
    
    // Get the API key from the URL parameter for testing
    const url = new URL(request.url)
    const apiKey = url.searchParams.get('key') || process.env.DEEPSEEK_API_KEY || HARDCODED_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key provided',
        help: 'Add ?key=your_api_key to the URL to test with a specific key',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }
    
    // Mask the key for logging
    const maskedKey = apiKey.length > 8 
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
      : '****'
    
    console.log(`Testing with key: ${maskedKey} (${apiKey.length} chars)`)
    
    try {
      // Add a timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      // Make a minimal API call to test connectivity
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: 'Say hello' }
          ],
          max_tokens: 10
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))
      
      // Check the response
      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json({
          error: `DeepSeek API error: ${response.status}`,
          details: errorText,
          key_preview: maskedKey,
          timestamp: new Date().toISOString()
        }, { status: response.status })
      }
      
      // Parse the successful response
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || 'No content in response'
      
      return NextResponse.json({
        success: true,
        message: 'DeepSeek API test successful',
        content,
        key_preview: maskedKey,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Error testing DeepSeek API:', error)
      
      // Check for timeout errors
      const isTimeout = error instanceof DOMException && error.name === 'AbortError'
      
      return NextResponse.json({
        error: isTimeout ? 'API request timed out' : 'API request failed',
        details: error instanceof Error ? error.message : String(error),
        key_preview: maskedKey,
        timestamp: new Date().toISOString()
      }, { status: isTimeout ? 504 : 500 })
    }
    
  } catch (error) {
    console.error('Error in test-deepseek-direct route:', error)
    return NextResponse.json({
      error: 'Failed to run DeepSeek API test',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 