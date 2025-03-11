'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import './config-check' // Import the configuration check

// Basic client for non-authenticated operations
export const createBasicClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in client')
    // Return a dummy client that will fail gracefully
    return {
      from: () => ({
        select: () => ({ data: null, error: new Error('Supabase not configured') })
      })
    } as any
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
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
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          
          if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Missing Supabase environment variables in authenticated client')
            return
          }
          
          // Create authenticated client
          const authenticatedClient = createBrowserClient(
            supabaseUrl,
            supabaseAnonKey,
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