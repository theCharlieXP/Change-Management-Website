import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: 'No user ID found in session'
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { insightId, projectId, notes } = body

    // Validate required fields
    if (!insightId || !projectId) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'Both insightId and projectId are required'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Project not found',
          details: 'Project does not exist or you do not have access to it'
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if insight is already saved to this project
    const { data: existingInsight, error: existingError } = await supabase
      .from('saved_insights')
      .select('id')
      .eq('project_id', projectId)
      .eq('insight_id', insightId)
      .single()

    if (existingInsight) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Insight already saved',
          details: 'This insight is already saved to this project'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Save the insight
    const { data: savedInsight, error: saveError } = await supabase
      .from('saved_insights')
      .insert([
        {
          insight_id: insightId,
          project_id: projectId,
          user_id: userId,
          notes: notes || null
        }
      ])
      .select()
      .single()

    if (saveError) {
      console.error('Error saving insight:', saveError)
      throw saveError
    }

    return new NextResponse(
      JSON.stringify(savedInsight),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in save insight API:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to save insight',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const insightId = searchParams.get('insightId')

    if (!insightId) {
      return NextResponse.json(
        { error: 'Insight ID is required' },
        { status: 400 }
      )
    }

    // First verify that the insight belongs to a project owned by the user
    const insight = await supabase
      .from('saved_insights')
      .select('project_id')
      .eq('id', insightId)
      .eq('user_id', userId)
      .single()

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      )
    }

    // Verify that the project belongs to the user
    if (insight.project_id !== projectId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await supabase
      .from('saved_insights')
      .delete()
      .eq('id', insightId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing saved insight:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 