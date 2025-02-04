import { createBrowserClient } from '@supabase/ssr'

export async function createSupabaseClient(token?: string | null) {
  // Create the Supabase client with the JWT token in headers
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined
      }
    }
  )

  // For debugging purposes
  if (token) {
    try {
      // Decode the JWT to log the payload
      const [, payloadBase64] = token.split('.')
      const payload = JSON.parse(atob(payloadBase64))
      console.log('JWT payload:', payload)
    } catch (error) {
      console.error('Error decoding JWT:', error)
    }
  }

  return supabase
}

export async function testSupabaseAuth(token: string) {
  if (!token) {
    throw new Error('No token provided for authentication test')
  }

  try {
    // Decode the JWT to verify its contents
    const [, payloadBase64] = token.split('.')
    const payload = JSON.parse(atob(payloadBase64))
    
    if (!payload.sub) {
      throw new Error('JWT missing sub claim')
    }

    console.log('Authentication test - JWT payload:', payload)
    return { id: payload.sub }
  } catch (error) {
    console.error('Authentication test failed:', error)
    throw error
  }
} 