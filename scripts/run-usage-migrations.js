#!/usr/bin/env node

/**
 * This script runs the SQL migrations for the usage tracker feature.
 * It creates the necessary table and functions in the database.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service key not found in environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration files to run in order
const migrationFiles = [
  'create_exec_sql_function.sql',
  'create_usage_tracker_table.sql',
  'increment_usage_function.sql',
  'reset_usage_function.sql'
];

// Function to execute SQL directly if RPC method fails
async function executeSqlDirectly(sql) {
  try {
    // Try to use the SQL API directly
    const { data, error } = await supabase.from('_sql').select('*').execute(sql);
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (directError) {
    console.error('Direct SQL execution failed:', directError);
    return { data: null, error: directError };
  }
}

async function runMigrations() {
  console.log('Running usage tracker migrations...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);

  // First check if we can connect to Supabase
  try {
    const { data, error } = await supabase.from('_pgsodium_key_enc_keys').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      console.error('Please check your credentials and make sure you have the correct permissions.');
      process.exit(1);
    }
    
    console.log('Successfully connected to Supabase');
  } catch (connectionError) {
    console.error('Failed to connect to Supabase:', connectionError);
    console.error('Please check your credentials and make sure you have the correct permissions.');
    process.exit(1);
  }

  for (const file of migrationFiles) {
    try {
      const filePath = path.join(__dirname, '..', 'prisma', 'migrations', file);
      
      if (!fs.existsSync(filePath)) {
        console.error(`Migration file not found: ${filePath}`);
        continue;
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Running migration: ${file}`);
      console.log(`SQL to execute: ${sql.substring(0, 100)}...`);
      
      // First try using the exec_sql RPC function
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error running migration ${file} via RPC:`, error);
        console.log('Trying direct SQL execution as fallback...');
        
        // Try direct SQL execution as fallback
        const { error: directError } = await executeSqlDirectly(sql);
        
        if (directError) {
          console.error(`Failed to run migration ${file} via direct SQL execution:`, directError);
          console.error('Please run the SQL manually in your database:');
          console.error(sql);
        } else {
          console.log(`Successfully ran migration: ${file} via direct SQL execution`);
        }
      } else {
        console.log(`Successfully ran migration: ${file} via RPC`);
      }
    } catch (err) {
      console.error(`Error processing migration file ${file}:`, err);
    }
  }

  console.log('Migrations completed.');
}

runMigrations()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 