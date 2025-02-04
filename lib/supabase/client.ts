import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

// Basic client for non-authenticated operations
export const createBasicClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Hook for getting an authenticated Supabase client
export function useSupabaseClient() {
  const { getToken } = useAuth()
  const [client, setClient] = useState(createBasicClient())

  useEffect(() => {
    const setupClient = async () => {
      try {
        // Get token with custom template that includes user_id claim
        const token = await getToken({ 
          template: 'supabase',
        })
        
        if (token) {
          // Log token and decode JWT for debugging
          console.log('Got token:', token)
          
          try {
            const [headerBase64, payloadBase64, signature] = token.split('.')
            const payload = JSON.parse(atob(payloadBase64))
            
            // Log all available claims for debugging
            const claims = {
              ...payload,
              decoded_at: new Date().toISOString()
            }
            console.log('JWT Claims:', JSON.stringify(claims, null, 2))

            // Create authenticated client with JWT token
            const authenticatedClient = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              {
                global: {
                  headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                  }
                },
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                  detectSessionInUrl: false
                }
              }
            )

            // Set the session with the JWT token
            const { error: sessionError } = await authenticatedClient.auth.setSession({
              access_token: token,
              refresh_token: ''
            })

            if (sessionError) {
              console.error('Failed to set session:', sessionError)
              return
            }

            // Test authentication and JWT claims
            const { data: testData, error: testError } = await authenticatedClient
              .rpc('debug_jwt_claims')
              .single()

            if (testError) {
              console.error('JWT verification failed:', testError)
            } else {
              console.log('JWT verification succeeded:', testData)
            }

            // Test the client with a simple query
            const { data: testData2, error: testError2 } = await authenticatedClient
              .from('projects')
              .select('count')
              .limit(1)
              .single()

            if (testError2) {
              console.error('Client test failed:', {
                code: testError2.code,
                message: testError2.message,
                details: testError2.details,
                hint: testError2.hint
              })

              // Try to get the session data from Supabase
              const { data: sessionData, error: sessionError } = await authenticatedClient
                .auth.getSession()

              if (sessionError) {
                console.error('Failed to get session from Supabase:', sessionError)
              } else {
                console.log('Supabase session data:', sessionData)
              }
            } else {
              console.log('Client test succeeded:', testData2)
            }

            setClient(authenticatedClient)
          } catch (error) {
            console.error('Error setting up authenticated client:', error)
          }
        } else {
          console.warn('No token received from Clerk')
        }
      } catch (error) {
        console.error('Error in setupClient:', error)
      }
    }

    setupClient()
  }, [getToken])

  return client
} 