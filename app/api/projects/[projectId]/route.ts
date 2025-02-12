import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with the service role key
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
    const { userId } = auth()
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (error) {
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
    const { userId } = auth()
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
    const { userId } = auth()
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', params.projectId)
      .eq('user_id', userId)

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