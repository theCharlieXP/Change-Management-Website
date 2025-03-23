import { NextResponse } from 'next/server'

// Set proper runtime for API compatibility
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'default-no-store'

export async function GET(request: Request) {
  try {
    console.log('Test DeepSeek Key request received at', new Date().toISOString())
    
    // Get the DeepSeek API key from environment variables
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
    
    // Mask the key for security when logging
    let maskedKey = 'NOT_FOUND'
    let keyLength = 0
    
    if (DEEPSEEK_API_KEY) {
      keyLength = DEEPSEEK_API_KEY.length
      if (keyLength > 8) {
        maskedKey = `${DEEPSEEK_API_KEY.substring(0, 4)}...${DEEPSEEK_API_KEY.substring(DEEPSEEK_API_KEY.length - 4)}`
      } else if (keyLength > 0) {
        maskedKey = '***' // Just mask it completely if it's too short
      }
    }
    
    // Debug environment info
    console.log('Environment info:', {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
      deepseek_key_exists: !!DEEPSEEK_API_KEY,
      deepseek_key_length: keyLength
    })
    
    // Log all environment variable names
    const envVarNames = Object.keys(process.env).sort()
    console.log('Available environment variables:', envVarNames.length)
    
    // Check for specific environment variables (just checking existence, not values)
    const importantVars = [
      'DEEPSEEK_API_KEY',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'RESEND_API_KEY',
      'TAVILY_API_KEY'
    ]
    
    // Fix TypeScript error by defining the proper type
    const envStatus: Record<string, {exists: boolean, length: number}> = {}
    
    importantVars.forEach(varName => {
      const exists = !!process.env[varName]
      const value = process.env[varName]
      envStatus[varName] = {
        exists,
        length: value ? value.length : 0
      }
    })
    
    // Return information about the environment
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
      deployment_url: process.env.VERCEL_URL,
      deepseek_key: {
        exists: !!DEEPSEEK_API_KEY,
        length: keyLength,
        preview: maskedKey
      },
      env_var_count: envVarNames.length,
      important_vars: envStatus
    })
  } catch (error) {
    console.error('Error in test-deepseek-key route:', error)
    return NextResponse.json({
      error: 'Failed to check DeepSeek API key',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 