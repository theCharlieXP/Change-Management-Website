import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              // Ensure secure cookies in production
              secure: process.env.NODE_ENV === 'production' ? true : options?.secure,
              // Ensure proper sameSite attribute
              sameSite: options?.sameSite || 'lax',
              // Set path if not provided
              path: options?.path || '/',
              // Set httpOnly if not provided
              httpOnly: options?.httpOnly ?? true
            })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              path: options?.path || '/',
              expires: new Date(0)
            })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
} 