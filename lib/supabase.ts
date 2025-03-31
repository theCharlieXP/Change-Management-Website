import { createClient } from '@supabase/supabase-js'
import './supabase/config-check' // Import the configuration check

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a dummy client if configuration is missing
const createDummyClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') })
    },
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') })
    })
  } as any
}

// Create the Supabase client
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient()

export default supabase

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Helper function to test database connection
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) throw error
    return { ok: true }
  } catch (error) {
    console.error('Database connection test failed:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Helper function to get the current session
export async function getSupabaseSession() {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting Supabase session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Failed to get Supabase session:', error)
    return null
  }
}

// Helper function to get user data
export async function getSupabaseUser() {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting Supabase user:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Failed to get Supabase user:', error)
    return null
  }
}

// Helper function to check database connection
export async function checkSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Failed to test Supabase connection:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return false
  }
} 