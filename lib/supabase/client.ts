import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { type SupabaseClient } from '@supabase/supabase-js'

// Keep the original createClient for backward compatibility
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Add the new useSupabase hook with better error handling
export function useSupabase() {
  const { getToken } = useAuth()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    const initSupabase = async () => {
      try {
        const token = await getToken({ template: 'supabase' })
        console.log('Got Clerk token:', !!token)
        
        if (token) {
          // Log JWT payload for debugging
          const [, payloadBase64] = token.split('.')
          const payload = JSON.parse(atob(payloadBase64))
          console.log('JWT payload:', payload)
        }

        const client = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: token ? `Bearer ${token}` : ''
              }
            }
          }
        )

        // Test authentication
        const { data: authData, error: authError } = await client.auth.getUser()
        console.log('Supabase auth test:', { authData, authError })

        setSupabase(client)
      } catch (error) {
        console.error('Error initializing Supabase client:', error)
        // Fall back to unauthenticated client
        const client = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        setSupabase(client)
      }
    }

    initSupabase()
  }, [getToken])

  if (!supabase) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return supabase
} 