const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function applyMigration() {
  try {
    console.log('Applying saved_communications migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240601000000_create_saved_communications.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      
      const { error } = await supabase.rpc('pgmigrate', { query: statement });
      
      if (error) {
        if (error.message.includes('function "pgmigrate" does not exist')) {
          console.log('pgmigrate function not available, using raw query instead');
          
          // Try direct query instead
          const { error: queryError } = await supabase.rpc('pg_query', { query: statement });
          
          if (queryError) {
            if (queryError.message.includes('function "pg_query" does not exist')) {
              console.error('Cannot execute SQL directly. Please run migrations using the Supabase CLI.');
              console.error('Alternatively, you can create the table manually in the Supabase dashboard.');
              console.error('Migration file:', migrationPath);
              process.exit(1);
            }
            
            console.error('Error executing statement:', queryError);
          }
        } else {
          console.error('Error executing statement:', error);
        }
      }
    }
    
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration(); 