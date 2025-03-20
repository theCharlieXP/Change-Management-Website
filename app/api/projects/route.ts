import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Add environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  })
  throw new Error('Missing required Supabase environment variables')
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Helper function to test database connection and table existence
async function testDatabaseConnection() {
  try {
    // Test if we can connect and if the projects table exists
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        console.error('Projects table does not exist:', error)
        return { ok: false, error: 'Table does not exist' }
      }
      
      console.error('Database connection test failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (error) {
    console.error('Failed to test database connection:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function GET() {
  try {
    // Get the user ID from Clerk
    const authData = await auth();
    const { userId } = authData
    
    // Log auth state
    console.log('Auth state in projects API:', {
      hasUserId: !!userId,
      userId,
      supabaseConfig: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }
    })
    
    if (!userId) {
      console.log('No user ID found in session')
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Please sign in to access this resource' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Test database connection first
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest.ok) {
      console.error('Database connection test failed:', connectionTest.error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database connection failed',
          details: connectionTest.error
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch projects using the service role client
    console.log('Fetching projects for user:', userId)
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, description, user_id, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Supabase query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId
      })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to fetch projects',
          details: error.message
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the projects data for debugging
    console.log('Projects data:', {
      count: projects?.length,
      firstProject: projects?.[0] ? {
        id: projects[0].id,
        title: projects[0].name,
        keys: Object.keys(projects[0])
      } : null,
      userId
    })

    return new NextResponse(
      JSON.stringify(projects || []),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    // Enhanced error logging
    console.error('Error in projects API:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      supabaseConfig: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)
      }
    })

    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch projects',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authData = await auth();
    const { userId } = authData

    console.log('Project creation request:', {
      hasUserId: !!userId,
      userId,
      headers: Object.fromEntries(request.headers),
      supabaseConfig: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }
    })

    if (!userId) {
      console.error('No user ID found in session during project creation')
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Please sign in to create a project',
          details: 'No user ID found in session'
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const body = await request.json()
    const { title } = body

    if (!title) {
      console.error('Missing project title in request:', { userId })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Project title is required',
          details: 'Title field is missing or empty'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Creating project:', {
      title,
      userId
    })

    // Test database connection
    const connectionTest = await testDatabaseConnection()
    if (!connectionTest.ok) {
      console.error('Database connection test failed during project creation:', {
        error: connectionTest.error,
        userId
      })
      throw new Error(`Database connection failed: ${connectionTest.error}`)
    }

    // Create the project
    const { data: project, error } = await supabase
      .from('projects')
      .insert([
        {
          title,
          user_id: userId,
          status: 'planning'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating project in Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId,
        title
      })
      throw error
    }

    console.log('Project created successfully:', {
      projectId: project.id,
      title: project.title,
      userId: project.user_id
    })

    return new NextResponse(
      JSON.stringify(project),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in create project API:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      supabaseConfig: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)
      }
    })

    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to create project',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 