import { createBrowserClient } from '@supabase/ssr'

export async function getSupabaseClient(clerkToken?: string | null) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: clerkToken ? `Bearer ${clerkToken}` : ''
        }
      }
    }
  )

  return supabase
} 