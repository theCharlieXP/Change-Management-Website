import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    console.log('[TEST_SUPABASE] Starting test');
    
    // Check authentication
    const { userId } = auth();
    console.log('[TEST_SUPABASE] User ID:', userId);
    
    if (!userId) {
      console.log('[TEST_SUPABASE] Unauthorized - No user ID');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Test Supabase connection
    console.log('[TEST_SUPABASE] Testing Supabase connection');
    console.log('[TEST_SUPABASE] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[TEST_SUPABASE] Supabase Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Try to query the projects table (which should exist)
    console.log('[TEST_SUPABASE] Querying projects table');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1);
      
    if (projectsError) {
      console.error('[TEST_SUPABASE] Error querying projects:', projectsError);
      return NextResponse.json({ 
        success: false, 
        error: projectsError,
        message: 'Failed to query projects table'
      }, { status: 500 });
    }
    
    // Try to check if saved_communications table exists
    console.log('[TEST_SUPABASE] Checking if saved_communications table exists');
    const { data: savedComms, error: savedCommsError } = await supabase
      .from('saved_communications')
      .select('count')
      .limit(1);
      
    const tableExists = !savedCommsError || savedCommsError.code !== '42P01';
    
    // Return the test results
    return NextResponse.json({
      success: true,
      supabaseConnected: true,
      projectsTableWorking: true,
      savedCommunicationsTableExists: tableExists,
      projects: projects,
      savedCommsError: savedCommsError ? {
        code: savedCommsError.code,
        message: savedCommsError.message
      } : null
    });
  } catch (error) {
    console.error('[TEST_SUPABASE] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 