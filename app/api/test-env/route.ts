import { NextResponse } from 'next/server'

// Set this endpoint to explicitly not require authentication
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  // Check environment variables without exposing sensitive data
  const envCheck = {
    // Check basic Node.js environment
    NODE_ENV: process.env.NODE_ENV,
    
    // Check Supabase environment variables
    supabase: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Check key lengths to verify they're loaded
      keyLengths: {
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      },
      
      // Check URL format
      urlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') ? 'valid' : 'invalid'
    },
    
    // Check if we're running in development or production
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    
    // Check for any .env file that might be loaded
    dotEnvFiles: {
      hasEnv: process.env.NEXT_PUBLIC_ENV_LOADED === 'true',
      hasEnvLocal: process.env.NEXT_PUBLIC_ENV_LOCAL_LOADED === 'true',
      hasDevelopmentEnv: process.env.NEXT_PUBLIC_ENV_DEVELOPMENT_LOADED === 'true'
    }
  }
  
  console.log('Environment check:', envCheck)
  
  return NextResponse.json(envCheck)
} 