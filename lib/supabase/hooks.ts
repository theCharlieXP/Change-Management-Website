import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseClient } from './auth-helper'

export function useAuthenticatedSupabase() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { getToken } = useAuth()

  useEffect(() => {
    const initSupabase = async () => {
      try {
        const token = await getToken({ template: 'supabase' })
        const client = await createSupabaseClient(token)
        setSupabase(client)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to initialize Supabase client'))
        setSupabase(null)
      } finally {
        setLoading(false)
      }
    }

    initSupabase()
  }, [getToken])

  return { supabase, loading, error }
} 