import { NextResponse } from 'next/server'
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
    // Get user ID from Clerk
    const { userId } = auth()
    
    // Log auth state
    console.log('Auth state in get project insights API:', {
      hasUserId: !!userId,
      userId,
      projectId: params.projectId,
      supabaseConfig: {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }
    })

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
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
        hint: projectError.hint
      })
      
      if (projectError.code === 'PGRST116') {
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
      
      throw projectError
    }

    // Fetch saved insights for the project
    console.log('Fetching insights for project:', params.projectId)
    const { data: insights, error: insightsError } = await supabase
      .from('saved_insights')
      .select('*')
      .eq('project_id', params.projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (insightsError) {
      console.error('Error fetching insights:', {
        code: insightsError.code,
        message: insightsError.message,
        details: insightsError.details,
        hint: insightsError.hint
      })
      throw insightsError
    }

    console.log('Successfully fetched insights:', {
      count: insights?.length,
      firstInsight: insights?.[0] ? {
        id: insights[0].id,
        title: insights[0].title
      } : null
    })

    return new NextResponse(
      JSON.stringify(insights || []),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in get project insights API:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      supabaseConfig: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })

    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
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