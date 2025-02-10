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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select()
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const { 
      title,
      url,
      summary,
      additional_notes 
    } = await request.json()

    // Create saved insight
    const { data: savedInsight, error: insertError } = await supabase
      .from('saved_insights')
      .insert({
        title,
        url,
        summary,
        additional_notes,
        project_id: params.projectId
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving insight:', insertError)
      return NextResponse.json(
        { error: 'Failed to save insight' },
        { status: 500 }
      )
    }

    return NextResponse.json(savedInsight)
  } catch (error) {
    console.error('Error saving insight:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select()
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get all saved insights for the project
    const { data: savedInsights, error: insightsError } = await supabase
      .from('saved_insights')
      .select()
      .eq('project_id', params.projectId)
      .order('created_at', { ascending: false })

    if (insightsError) {
      console.error('Error fetching saved insights:', insightsError)
      return NextResponse.json(
        { error: 'Failed to fetch insights' },
        { status: 500 }
      )
    }

    return NextResponse.json(savedInsights)
  } catch (error) {
    console.error('Error fetching saved insights:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
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

    // Check if project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select()
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Delete the saved insight
    const { error: deleteError } = await supabase
      .from('saved_insights')
      .delete()
      .eq('id', insightId)
      .eq('project_id', params.projectId)

    if (deleteError) {
      console.error('Error deleting saved insight:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete insight' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved insight:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 