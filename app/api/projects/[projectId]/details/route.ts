import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Project } from '@/types/projects'

// Create a Supabase client with the service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we have the required credentials
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlFormat: supabaseUrl?.startsWith('https://') ? 'valid' : 'invalid',
    serviceKeyLength: supabaseServiceKey?.length || 0
  });
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || '', // Provide empty string as fallback
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
  console.log('Project details API route called for project:', params.projectId)
  
  // Check if we have required credentials
  if (!supabaseServiceKey) {
    console.error('Cannot fetch project details: Missing Supabase service key');
    return new NextResponse(
      JSON.stringify({ 
        error: 'Server configuration error',
        details: 'Missing required Supabase credentials'
      }),
      { status: 500 }
    )
  }
  
  try {
    // Get authentication data
    const authData = await auth();
    const { userId } = authData
    
    console.log('Auth check for project details:', {
      hasAuth: !!authData,
      hasUserId: !!userId,
      projectId: params.projectId
    })
    
    if (!userId) {
      console.log('Unauthorized request to project details', { projectId: params.projectId })
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Fetch the project first
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      console.error('Error fetching project:', projectError)
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
      console.error('Error fetching tasks:', tasksError)
      throw tasksError
    }

    // Fetch notes
    const { data: notes, error: notesError } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', params.projectId)
      .order('created_at', { ascending: false })

    if (notesError) {
      console.error('Error fetching notes:', notesError)
      throw notesError
    }

    // Return all data in a single response
    return new NextResponse(
      JSON.stringify({
        project,
        tasks,
        notes
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in project details API:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to fetch project details',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 