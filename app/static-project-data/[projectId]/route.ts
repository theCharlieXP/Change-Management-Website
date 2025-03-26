import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  console.log('Static project data API route called for project:', params.projectId)
  
  try {
    // Get authentication data
    const authData = await auth();
    const { userId } = authData
    
    console.log('Auth check for static project data:', {
      hasAuth: !!authData,
      hasUserId: !!userId,
      projectId: params.projectId,
      headers: Object.fromEntries([...Object.entries(request.headers)].filter(([key]) => 
        key.startsWith('x-') || 
        key.includes('auth') || 
        key.includes('cookie') || 
        key === 'host' || 
        key === 'user-agent'
      ))
    })
    
    if (!userId) {
      console.log('Unauthorized request to static project data', { projectId: params.projectId })
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if we have required credentials
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials in static project data API');
      return new NextResponse(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing required Supabase credentials'
        }),
        { status: 500 }
      )
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    // Fetch the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      console.error('Error fetching project in static data route:', projectError)
      if (projectError.code === 'PGRST116') {
        return new NextResponse(
          JSON.stringify({ error: 'Project not found' }),
          { status: 404 }
        )
      }
      throw projectError
    }

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', params.projectId)
      .order('position', { ascending: true })

    if (tasksError) {
      console.error('Error fetching tasks in static data route:', tasksError)
      throw tasksError
    }

    // Fetch notes
    const { data: notes, error: notesError } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', params.projectId)
      .order('created_at', { ascending: false })

    if (notesError) {
      console.error('Error fetching notes in static data route:', notesError)
      throw notesError
    }

    // Return all data with additional debugging info
    return new NextResponse(
      JSON.stringify({
        project,
        tasks: tasks || [],
        notes: notes || [],
        debug: {
          timestamp: new Date().toISOString(),
          userId,
          serviceKeyAvailable: !!supabaseServiceKey
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'X-Static-Project-Data': 'true'
        }
      }
    )
  } catch (error) {
    console.error('Error in static project data API:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch project data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 