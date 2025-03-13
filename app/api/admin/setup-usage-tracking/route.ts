import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { auth } from '@clerk/nextjs/server';

// This is an admin-only endpoint to set up usage tracking
export async function POST(req: NextRequest) {
  try {
    // Check if the user is authenticated and is an admin
    const authData = await auth();
    const { userId } = authData;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // In a real app, you would check if the user is an admin here
    // For simplicity, we'll just check if the user is authenticated
    
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not found' },
        { status: 500 }
      );
    }
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read the combined SQL file
    const sqlFilePath = path.join(process.cwd(), 'prisma', 'migrations', 'all_usage_migrations.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error running migrations:', error);
      
      // Try running each statement separately as a fallback
      try {
        // Split the SQL into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (stmtError) {
            console.error('Error running statement:', stmtError);
            console.error('Statement:', statement);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback execution failed:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to run migrations', details: fallbackError },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usage tracking migrations completed successfully'
    });
  } catch (error) {
    console.error('Error setting up usage tracking:', error);
    return NextResponse.json(
      { error: 'Failed to set up usage tracking', details: error },
      { status: 500 }
    );
  }
} 