import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: Request) {
  try {
    console.log('[DELETE_COMMUNICATION] Starting request');
    
    // Check authentication
    const { userId } = auth();
    console.log('[DELETE_COMMUNICATION] User ID:', userId);
    
    if (!userId) {
      console.log('[DELETE_COMMUNICATION] Unauthorized - No user ID');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the communication ID from the URL
    const url = new URL(req.url);
    const communicationId = url.searchParams.get('id');
    console.log('[DELETE_COMMUNICATION] Communication ID:', communicationId);

    if (!communicationId) {
      console.log('[DELETE_COMMUNICATION] Missing communication ID');
      return new NextResponse("Missing communication ID", { status: 400 });
    }

    try {
      console.log('[DELETE_COMMUNICATION] Connecting to Supabase');
      
      // Try to use service role key if available to bypass RLS
      let client = supabase;
      
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('[DELETE_COMMUNICATION] Using service role key to bypass RLS');
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
      
      // First, verify that the communication belongs to the user
      const { data: communicationData, error: fetchError } = await client
        .from('saved_communications')
        .select('user_id')
        .eq('id', communicationId)
        .single();

      if (fetchError) {
        console.error('[DELETE_COMMUNICATION_ERROR] Error fetching communication:', fetchError);
        return new NextResponse(`Database Error: ${fetchError.message}`, { status: 500 });
      }

      if (!communicationData) {
        console.log('[DELETE_COMMUNICATION] Communication not found');
        return new NextResponse("Communication not found", { status: 404 });
      }

      if (communicationData.user_id !== userId) {
        console.log('[DELETE_COMMUNICATION] Unauthorized - User does not own this communication');
        return new NextResponse("Unauthorized", { status: 403 });
      }
      
      // Delete the communication
      console.log('[DELETE_COMMUNICATION] Deleting communication');
      const { error: deleteError } = await client
        .from('saved_communications')
        .delete()
        .eq('id', communicationId);

      if (deleteError) {
        console.error('[DELETE_COMMUNICATION_ERROR] Error deleting communication:', deleteError);
        return new NextResponse(`Database Error: ${deleteError.message}`, { status: 500 });
      }

      console.log('[DELETE_COMMUNICATION] Success! Communication deleted');
      return new NextResponse(null, { status: 204 });
    } catch (dbError) {
      console.error('[DELETE_COMMUNICATION_DB_ERROR] Database error:', dbError);
      return new NextResponse(
        JSON.stringify({
          error: 'Database error',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[DELETE_COMMUNICATION_ERROR] Unexpected error:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 