import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = auth()
    
    console.log('PUT /api/projects/[projectId]/tasks/reorder:', {
      userId,
      projectId: params.projectId
    })

    if (!userId) {
      console.log('Unauthorized: No user ID found')
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'Please sign in to reorder tasks'
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
    const { tasks } = body

    console.log('Reordering tasks:', {
      projectId: params.projectId,
      userId,
      taskCount: tasks?.length,
      tasks
    })

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          details: 'Tasks must be an array'
        },
        { status: 400 }
      )
    }

    // Verify all tasks belong to the project
    const taskIds = tasks.map(task => task.id)
    const { data: existingTasks, error: verifyError } = await supabase
      .from('project_tasks')
      .select('id')
      .eq('project_id', params.projectId)
      .in('id', taskIds)

    if (verifyError) {
      console.error('Error verifying tasks:', {
        error: verifyError,
        projectId: params.projectId,
        taskIds
      })
      return NextResponse.json(
        { 
          error: 'Failed to verify tasks',
          details: verifyError.message
        },
        { status: 500 }
      )
    }

    if (!existingTasks || existingTasks.length !== tasks.length) {
      console.error('Task count mismatch:', {
        existingCount: existingTasks?.length,
        requestedCount: tasks.length,
        existingTasks,
        requestedTasks: tasks
      })
      return NextResponse.json(
        { 
          error: 'Invalid tasks',
          details: 'Some tasks do not belong to this project'
        },
        { status: 400 }
      )
    }

    // Update task positions in a transaction
    const updates = tasks.map((task, index) => ({
      id: task.id,
      position: index,
      updated_at: new Date().toISOString()
    }))

    console.log('Updating task positions:', {
      updates,
      projectId: params.projectId
    })

    // First get the existing tasks to preserve their data
    const { data: existingTaskData, error: fetchError } = await supabase
      .from('project_tasks')
      .select('*')
      .in('id', tasks.map(t => t.id))

    if (fetchError) {
      console.error('Error fetching existing tasks:', {
        error: fetchError,
        updates,
        projectId: params.projectId
      })
      return NextResponse.json(
        { 
          error: 'Failed to fetch existing tasks',
          details: fetchError.message
        },
        { status: 500 }
      )
    }

    // Merge the position updates with existing data
    const mergedUpdates = updates.map(update => {
      const existingTask = existingTaskData?.find(t => t.id === update.id)
      return {
        ...existingTask,
        position: update.position,
        updated_at: update.updated_at
      }
    })

    const { error: updateError } = await supabase
      .from('project_tasks')
      .upsert(mergedUpdates)

    if (updateError) {
      console.error('Error updating task positions:', {
        error: updateError,
        updates,
        projectId: params.projectId
      })
      return NextResponse.json(
        { 
          error: 'Failed to update task positions',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/projects/[projectId]/tasks/reorder:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      projectId: params.projectId
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 