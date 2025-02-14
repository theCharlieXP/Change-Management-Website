import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: Request,
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

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const { taskId, newPosition } = await request.json()

    // Get all tasks for the project ordered by position
    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('id, position')
      .eq('project_id', params.projectId)
      .order('position')

    if (tasksError) {
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    // Calculate new positions
    const updatedTasks = tasks.map((task, index) => ({
      id: task.id,
      position: index
    }))

    // Move the task to its new position
    const taskToMove = updatedTasks.find(t => t.id === taskId)
    if (!taskToMove) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    updatedTasks.splice(updatedTasks.indexOf(taskToMove), 1)
    updatedTasks.splice(newPosition, 0, taskToMove)

    // Update all task positions
    const { error: updateError } = await supabase
      .from('project_tasks')
      .upsert(
        updatedTasks.map((task, index) => ({
          id: task.id,
          position: index,
          updated_at: new Date().toISOString()
        }))
      )

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update task positions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 