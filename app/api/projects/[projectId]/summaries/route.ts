import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
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

    const body = await request.json()
    console.log('Received request body:', body)
    
    const { title, content, notes, focus_area } = body
    
    // Validate required fields
    if (!title || !content || !focus_area) {
      console.error('Missing required fields:', { title, content, focus_area })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Title, content, and focus_area are required'
        }),
        { status: 400 }
      )
    }

    // Verify project ownership
    console.log('Verifying project ownership:', { projectId: params.projectId, userId })
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      console.error('Project verification error:', projectError)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Project not found or access denied',
          details: projectError.message
        }),
        { status: 404 }
      )
    }

    // Check if a summary with the same title already exists for this project
    console.log('Checking for existing summary:', { projectId: params.projectId, title })
    const { data: existingSummary, error: checkError } = await supabase
      .from('insight_summaries')
      .select('id')
      .eq('project_id', params.projectId)
      .eq('title', title)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing summary:', checkError)
      throw checkError
    }

    if (existingSummary) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Summary already exists',
          details: 'A summary with this title already exists in this project'
        }),
        { status: 400 }
      )
    }

    // Prepare the summary data
    const summaryData = {
      project_id: params.projectId,
      title,
      content: Array.isArray(content) ? content.join('\n\n') : content,
      notes: notes || null,
      focus_area
    }

    console.log('Saving summary with data:', summaryData)

    // Save the summary
    const { data: summary, error: summaryError } = await supabase
      .from('insight_summaries')
      .insert([summaryData])
      .select()
      .single()

    if (summaryError) {
      console.error('Error saving summary:', {
        error: summaryError,
        code: summaryError.code,
        message: summaryError.message,
        details: summaryError.details,
        hint: summaryError.hint
      })
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to save summary',
          details: summaryError.message
        }),
        { status: 500 }
      )
    }

    console.log('Successfully saved summary:', summary)

    return new NextResponse(
      JSON.stringify(summary),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/projects/[projectId]/summaries:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
}

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

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 404 }
      )
    }

    // Get all summaries for the project
    const { data: summaries, error: summariesError } = await supabase
      .from('insight_summaries')
      .select('*')
      .eq('project_id', params.projectId)
      .order('created_at', { ascending: false })

    if (summariesError) {
      console.error('Error fetching summaries:', summariesError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch summaries' }),
        { status: 500 }
      )
    }

    return new NextResponse(
      JSON.stringify(summaries),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/summaries:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const body = await request.json()
    const { id, notes } = body

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Summary ID is required' }),
        { status: 400 }
      )
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 404 }
      )
    }

    // Verify summary belongs to the project
    const { data: existingSummary, error: summaryError } = await supabase
      .from('insight_summaries')
      .select('id')
      .eq('id', id)
      .eq('project_id', params.projectId)
      .single()

    if (summaryError || !existingSummary) {
      return new NextResponse(
        JSON.stringify({ error: 'Summary not found or does not belong to this project' }),
        { status: 404 }
      )
    }

    // Update the summary notes
    const { data: updatedSummary, error: updateError } = await supabase
      .from('insight_summaries')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating summary notes:', updateError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update summary notes' }),
        { status: 500 }
      )
    }

    return new NextResponse(
      JSON.stringify(updatedSummary),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/projects/[projectId]/summaries:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
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

    const body = await request.json()
    const { id } = body

    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Summary ID is required' }),
        { status: 400 }
      )
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return new NextResponse(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 404 }
      )
    }

    // Verify summary belongs to the project
    const { data: existingSummary, error: summaryError } = await supabase
      .from('insight_summaries')
      .select('id')
      .eq('id', id)
      .eq('project_id', params.projectId)
      .single()

    if (summaryError || !existingSummary) {
      return new NextResponse(
        JSON.stringify({ error: 'Summary not found or does not belong to this project' }),
        { status: 404 }
      )
    }

    // Delete the summary
    const { error: deleteError } = await supabase
      .from('insight_summaries')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting summary:', deleteError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to delete summary' }),
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]/summaries:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 