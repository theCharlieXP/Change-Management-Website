import { createClient } from '@supabase/supabase-js'

// Create a server-side Supabase client with the service role key
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('Creating server Supabase client:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlFormat: supabaseUrl?.startsWith('https://') ? 'valid' : 'invalid',
    serviceKeyLength: supabaseServiceKey?.length || 0
  })

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables in server client')
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

// Export a singleton instance
export const supabaseServer = createServerClient() 