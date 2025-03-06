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
        error: 'Missing Supabase credentials'
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
    
    // SQL to create the table
    const createTableSQL = `
      -- Drop the table if it exists
      DROP TABLE IF EXISTS saved_communications CASCADE;
      
      -- Create the saved_communications table
      CREATE TABLE saved_communications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        communication_type TEXT,
        messages JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT saved_communications_user_id_not_empty CHECK (user_id <> '')
      );
    `;
    
    // SQL to create indexes
    const createIndexesSQL = `
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_saved_communications_user_id ON saved_communications(user_id);
      CREATE INDEX IF NOT EXISTS idx_saved_communications_project_id ON saved_communications(project_id);
      CREATE INDEX IF NOT EXISTS idx_saved_communications_created_at ON saved_communications(created_at DESC);
    `;
    
    // SQL to create trigger
    const createTriggerSQL = `
      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION update_saved_communications_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_saved_communications_updated_at ON saved_communications;
      CREATE TRIGGER update_saved_communications_updated_at
        BEFORE UPDATE ON saved_communications
        FOR EACH ROW
        EXECUTE FUNCTION update_saved_communications_updated_at();
    `;
    
    // SQL to create RLS policies
    const createRLSSQL = `
      -- Enable Row Level Security
      ALTER TABLE saved_communications ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS policies
      CREATE POLICY "Enable read access for own saved communications"
        ON saved_communications FOR SELECT
        USING (auth.uid()::text = user_id);
      
      CREATE POLICY "Enable insert access for own saved communications"
        ON saved_communications FOR INSERT
        WITH CHECK (auth.uid()::text = user_id);
      
      CREATE POLICY "Enable update access for own saved communications"
        ON saved_communications FOR UPDATE
        USING (auth.uid()::text = user_id);
      
      CREATE POLICY "Enable delete access for own saved communications"
        ON saved_communications FOR DELETE
        USING (auth.uid()::text = user_id);
    `;
    
    // Execute each SQL statement separately
    const results = [];
    
    // Create table
    const { error: createTableError } = await supabase.rpc('pg_query', { query: createTableSQL });
    results.push({
      step: 'Create table',
      success: !createTableError,
      error: createTableError
    });
    
    // If table creation failed, return error
    if (createTableError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create table',
        details: createTableError,
        results
      }, { status: 500 });
    }
    
    // Create indexes
    const { error: createIndexesError } = await supabase.rpc('pg_query', { query: createIndexesSQL });
    results.push({
      step: 'Create indexes',
      success: !createIndexesError,
      error: createIndexesError
    });
    
    // Create trigger
    const { error: createTriggerError } = await supabase.rpc('pg_query', { query: createTriggerSQL });
    results.push({
      step: 'Create trigger',
      success: !createTriggerError,
      error: createTriggerError
    });
    
    // Create RLS policies
    const { error: createRLSError } = await supabase.rpc('pg_query', { query: createRLSSQL });
    results.push({
      step: 'Create RLS policies',
      success: !createRLSError,
      error: createRLSError
    });
    
    // Check if table was created successfully
    const { error: checkTableError } = await supabase
      .from('saved_communications')
      .select('count')
      .limit(1);
      
    const tableExists = !checkTableError || checkTableError.code !== '42P01';
    
    return NextResponse.json({
      success: tableExists,
      message: tableExists ? 'Table created successfully' : 'Failed to create table',
      results
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 