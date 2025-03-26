import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with the service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if we have the required credentials
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in project check API:', {
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

export async function POST(request: Request) {
  console.log('Project check API route called')
  
  // Check if we have required credentials
  if (!supabaseServiceKey) {
    console.error('Cannot check project access: Missing Supabase service key');
    return new NextResponse(
      JSON.stringify({ 
        error: 'Server configuration error',
        details: 'Missing required Supabase credentials',
        exists: false
      }),
      { status: 500 }
    )
  }
  
  try {
    // Get authentication data
    const authData = await auth();
    const { userId } = authData
    
    if (!userId) {
      console.log('Unauthorized request to project check')
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', authorized: false }),
        { status: 401 }
      )
    }

    // Get the projectId from the request body
    const body = await request.json()
    const { projectId } = body
    
    if (!projectId) {
      return new NextResponse(
        JSON.stringify({ error: 'Project ID is required', exists: false }),
        { status: 400 }
      )
    }

    console.log('Checking project access:', { userId, projectId })

    // Check if the project exists and is owned by the user
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking project:', error)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to check project',
          details: error.message,
          exists: false 
        }),
        { status: 500 }
      )
    }

    // Return whether the project exists and is accessible
    return new NextResponse(
      JSON.stringify({ 
        exists: !!data,
        projectId,
        userId
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in project check API:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to check project',
        details: error instanceof Error ? error.message : 'Unknown error',
        exists: false
      }),
      { status: 500 }
    )
  }
} 