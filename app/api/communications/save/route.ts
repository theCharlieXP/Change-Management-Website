import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    console.log('[SAVE_COMMUNICATION] Starting request');
    
    // Check authentication
    const { userId } = auth();
    console.log('[SAVE_COMMUNICATION] User ID:', userId);
    
    if (!userId) {
      console.log('[SAVE_COMMUNICATION] Unauthorized - No user ID');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log('[SAVE_COMMUNICATION] Request body:', JSON.stringify(body, null, 2));
    
    const { 
      projectId, 
      title, 
      content, 
      communicationType,
      messages 
    } = body;

    if (!projectId || !content) {
      console.log('[SAVE_COMMUNICATION] Missing required fields');
      return new NextResponse("Missing required fields", { status: 400 });
    }

    try {
      console.log('[SAVE_COMMUNICATION] Connecting to Supabase');
      console.log('[SAVE_COMMUNICATION] Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('[SAVE_COMMUNICATION] Supabase Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('[SAVE_COMMUNICATION] Supabase Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      // Try to use service role key if available to bypass RLS
      let client = supabase;
      
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('[SAVE_COMMUNICATION] Using service role key to bypass RLS');
        client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          }
        );
      }
      
      // Save the communication to Supabase
      console.log('[SAVE_COMMUNICATION] Attempting to insert data');
      const { data, error } = await client
        .from('saved_communications')
        .insert({
          project_id: projectId,
          user_id: userId,
          title: title || 'Untitled Communication',
          content,
          communication_type: communicationType || null,
          messages: messages || null
        })
        .select()
        .single();

      if (error) {
        console.error('[SAVE_COMMUNICATION_ERROR] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If the error is related to the table not existing, return a specific error
        if (error.code === '42P01') { // PostgreSQL error code for "relation does not exist"
          console.error('[SAVE_COMMUNICATION_ERROR] Table saved_communications does not exist yet');
          return new NextResponse(
            JSON.stringify({
              error: 'Database table not ready',
              message: 'The saved_communications table does not exist yet. Please run the database migrations.'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        return new NextResponse(`Database Error: ${error.message}`, { status: 500 });
      }

      console.log('[SAVE_COMMUNICATION] Success! Data saved:', data);
      return NextResponse.json(data);
    } catch (dbError) {
      console.error('[SAVE_COMMUNICATION_DB_ERROR] Database error:', dbError);
      return new NextResponse(
        JSON.stringify({
          error: 'Database error',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[SAVE_COMMUNICATION_ERROR] Unexpected error:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    console.log('[GET_SAVED_COMMUNICATIONS] Starting request');
    
    // Check authentication
    const { userId } = auth();
    console.log('[GET_SAVED_COMMUNICATIONS] User ID:', userId);
    
    if (!userId) {
      console.log('[GET_SAVED_COMMUNICATIONS] Unauthorized - No user ID');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the project ID from the URL
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    console.log('[GET_SAVED_COMMUNICATIONS] Project ID:', projectId);

    if (!projectId) {
      console.log('[GET_SAVED_COMMUNICATIONS] Missing project ID');
      return new NextResponse("Missing project ID", { status: 400 });
    }

    try {
      console.log('[GET_SAVED_COMMUNICATIONS] Connecting to Supabase');
      console.log('[GET_SAVED_COMMUNICATIONS] Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('[GET_SAVED_COMMUNICATIONS] Supabase Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('[GET_SAVED_COMMUNICATIONS] Supabase Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      // Try to use service role key if available to bypass RLS
      let client = supabase;
      
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('[GET_SAVED_COMMUNICATIONS] Using service role key to bypass RLS');
        client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          }
        );
      }
      
      // Get saved communications for the project
      console.log('[GET_SAVED_COMMUNICATIONS] Querying saved_communications table');
      const { data, error } = await client
        .from('saved_communications')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[GET_SAVED_COMMUNICATIONS_ERROR] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If the error is related to the table not existing, return an empty array
        if (error.code === '42P01') { // PostgreSQL error code for "relation does not exist"
          console.log('[GET_SAVED_COMMUNICATIONS] Table saved_communications does not exist yet, returning empty array');
          return NextResponse.json([]);
        }
        
        return new NextResponse(`Database Error: ${error.message}`, { status: 500 });
      }

      console.log('[GET_SAVED_COMMUNICATIONS] Success! Found', data.length, 'communications');
      return NextResponse.json(data);
    } catch (dbError) {
      console.error('[GET_SAVED_COMMUNICATIONS_DB_ERROR] Database error:', dbError);
      // Return an empty array if there's any database error
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('[GET_SAVED_COMMUNICATIONS_ERROR] Unexpected error:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 