import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    console.log('[EXECUTE_SQL] Starting request');
    
    // Check authentication
    const { userId } = auth();
    console.log('[EXECUTE_SQL] User ID:', userId);
    
    if (!userId) {
      console.log('[EXECUTE_SQL] Unauthorized - No user ID');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the SQL from the request body
    const body = await req.json();
    const { sql } = body;
    
    if (!sql) {
      console.log('[EXECUTE_SQL] Missing SQL');
      return new NextResponse("Missing SQL", { status: 400 });
    }
    
    console.log('[EXECUTE_SQL] Executing SQL');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map((statement: string) => statement.trim())
      .filter((statement: string) => statement.length > 0);
    
    const results = [];
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`[EXECUTE_SQL] Executing: ${statement.substring(0, 100)}...`);
      
      try {
        // Try to execute the SQL using rpc
        const { data, error } = await supabase.rpc('pg_query', { query: statement });
        
        if (error) {
          console.error('[EXECUTE_SQL] Error executing statement:', error);
          
          // If the function doesn't exist, we can't execute SQL directly
          if (error.message.includes('function "pg_query" does not exist')) {
            return NextResponse.json({
              success: false,
              error: 'Cannot execute SQL directly. Please run migrations using the Supabase dashboard.',
              message: 'The pg_query function does not exist in your Supabase project.'
            }, { status: 500 });
          }
          
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: false,
            error: {
              code: error.code,
              message: error.message
            }
          });
        } else {
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: true,
            data
          });
        }
      } catch (statementError) {
        console.error('[EXECUTE_SQL] Error executing statement:', statementError);
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: statementError instanceof Error ? statementError.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: results.every(result => result.success),
      results
    });
  } catch (error) {
    console.error('[EXECUTE_SQL] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 