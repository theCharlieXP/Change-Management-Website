import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Log environment variables (without exposing sensitive values)
console.log('API Route - Supabase configuration:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  urlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') ? 'valid' : 'invalid',
  serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
})

// Create a Supabase client with the service role key directly
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId
    
    // Create a Supabase client for the route handler
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    
    if (error) {
      throw error
    }
    
    if (!project) {
      return new NextResponse(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch project' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const authData = await auth();
    const { userId } = authData
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const updates = await request.json()

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return new NextResponse(
      JSON.stringify(project),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in project API:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const authData = await auth();
    const { userId } = authData
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const { error } = await supabase
      .rpc('soft_delete_project', {
        project_id: params.projectId
      })

    if (error) {
      throw error
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in project API:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to delete project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const authData = await auth();
    const { userId } = authData
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const { action } = await request.json()
    
    if (action === 'restore') {
      const { error } = await supabase
        .rpc('restore_project', {
          project_id: params.projectId
        })

      if (error) {
        throw error
      }

      return new NextResponse(null, { status: 200 })
    }

    return new NextResponse(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in project API:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to restore project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 