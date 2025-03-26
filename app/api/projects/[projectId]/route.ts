import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabase/server'

// Log environment variables (without exposing sensitive values)
console.log('Supabase configuration:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  urlFormat: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') ? 'valid' : 'invalid',
  serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
})

export async function GET(
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

    console.log('Fetching project:', {
      projectId: params.projectId,
      userId,
      hasServerClient: !!supabaseServer
    })

    const { data: project, error } = await supabaseServer
      .from('projects')
      .select('*')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      if (error.code === 'PGRST116') {
        return new NextResponse(null, { status: 404 })
      }
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
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
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

    const { data: project, error } = await supabaseServer
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

    const { error } = await supabaseServer
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
      const { error } = await supabaseServer
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