import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if the DeepSeek API key is configured
    const apiKey = process.env.DEEPSEEK_API_KEY
    const hasApiKey = !!apiKey
    
    return NextResponse.json({
      status: 'success',
      message: 'API test route is working',
      hasDeepSeekApiKey: hasApiKey,
      env: process.env.NODE_ENV
    })
  } catch (error: any) {
    console.error('Error in test API route:', error)
    return NextResponse.json(
      { error: `Test API error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
} 