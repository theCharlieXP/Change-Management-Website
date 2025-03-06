import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Check if credentials are available
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials',
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 });
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    // Test connection by querying the projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1);
      
    if (projectsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query projects table',
        details: projectsError
      }, { status: 500 });
    }
    
    // Check if saved_communications table exists
    const { data: savedComms, error: savedCommsError } = await supabase
      .from('saved_communications')
      .select('count')
      .limit(1);
      
    const tableExists = !savedCommsError || savedCommsError.code !== '42P01';
    
    // Return the results
    return NextResponse.json({
      success: true,
      supabaseConnected: true,
      projectsTableWorking: true,
      savedCommunicationsTableExists: tableExists,
      projects,
      savedCommsError: savedCommsError ? {
        code: savedCommsError.code,
        message: savedCommsError.message
      } : null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 