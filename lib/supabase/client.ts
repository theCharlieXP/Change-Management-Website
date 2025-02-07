'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

// Basic client for non-authenticated operations
export const createBasicClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  )
}

// Hook for getting an authenticated Supabase client
export function useSupabaseClient() {
  const { getToken } = useAuth()
  const [client, setClient] = useState(createBasicClient())

  useEffect(() => {
    const setupClient = async () => {
      try {
        // Get token with the supabase template
        const token = await getToken({ template: 'supabase' })
        
        if (token) {
          // Create authenticated client
          const authenticatedClient = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              },
              auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false
              }
            }
          )

          setClient(authenticatedClient)
        }
      } catch (error) {
        console.error('Error setting up Supabase client:', error)
      }
    }

    setupClient()
  }, [getToken])

  return client
} 