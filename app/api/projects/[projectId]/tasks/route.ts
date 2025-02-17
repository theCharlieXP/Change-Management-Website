import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First verify project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
      throw projectError
    }

    const { data: tasks, error } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', params.projectId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth()
    
    console.log('POST /api/projects/[projectId]/tasks:', {
      userId,
      projectId: params.projectId,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    if (!userId) {
      console.log('Unauthorized: No user ID found')
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'Please sign in to create tasks'
        },
        { status: 401 }
      )
    }

    // First verify project exists and belongs to user
    console.log('Verifying project ownership:', { projectId: params.projectId, userId })
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      console.error('Project verification error:', {
        code: projectError.code,
        message: projectError.message,
        details: projectError.details,
        hint: projectError.hint,
        userId,
        projectId: params.projectId
      })
      
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { 
            error: 'Project not found',
            details: 'Project does not exist or you do not have access to it'
          },
          { status: 404 }
        )
      }
      throw projectError
    }

    const body = await request.json()
    const { title, description = '', status = 'todo', due_date = null } = body

    console.log('Creating task:', {
      projectId: params.projectId,
      title,
      status,
      userId,
      body
    })

    if (!title) {
      return NextResponse.json(
        { 
          error: 'Task title is required',
          details: 'Please provide a title for the task'
        },
        { status: 400 }
      )
    }

    // Create task data object, omitting due_date if it's not supported
    const taskData = {
      project_id: params.projectId,
      title,
      description,
      status,
      user_id: userId
    }

    // Only add due_date if it's provided
    if (due_date) {
      try {
        const { data: testData, error: testError } = await supabase
          .from('project_tasks')
          .select('due_date')
          .limit(1)

        if (!testError) {
          // due_date column exists, safe to add it
          Object.assign(taskData, { due_date })
        }
      } catch (error) {
        console.warn('due_date column may not exist yet:', error)
      }
    }

    const { data: task, error } = await supabase
      .from('project_tasks')
      .insert([taskData])
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        projectId: params.projectId,
        userId,
        requestBody: body
      })
      return NextResponse.json(
        { 
          error: 'Failed to create task',
          details: error.message
        },
        { status: 500 }
      )
    }

    console.log('Task created successfully:', {
      taskId: task.id,
      projectId: params.projectId,
      userId
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error in POST /api/projects/[projectId]/tasks:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      projectId: params.projectId,
      supabaseConfig: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to create task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First verify project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
      throw projectError
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const { data: task, error } = await supabase
      .from('project_tasks')
      .update(updates)
      .eq('id', id)
      .eq('project_id', params.projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error in PATCH /api/projects/[projectId]/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First verify project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
      throw projectError
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId)
      .eq('project_id', params.projectId)

    if (error) {
      console.error('Error deleting task:', error)
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 