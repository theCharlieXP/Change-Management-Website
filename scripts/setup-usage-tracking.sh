#!/bin/bash

# This script sets up the usage tracking feature by running SQL migrations
# It uses the Supabase CLI if available, or falls back to the Node.js script

# Combined SQL file path
SQL_FILE="./prisma/migrations/all_usage_migrations.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Error: SQL file not found at $SQL_FILE"
  exit 1
fi

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
  echo "Supabase CLI found, using it to run migrations..."
  
  # Run the SQL using Supabase CLI
  supabase db execute --file "$SQL_FILE"
  
  if [ $? -eq 0 ]; then
    echo "Migrations completed successfully using Supabase CLI."
    exit 0
  else
    echo "Error running migrations with Supabase CLI."
    echo "Trying alternative methods..."
  fi
fi

# Check if psql is installed
if command -v psql &> /dev/null; then
  echo "psql found, trying to connect directly to the database..."
  
  # Check if database connection details are available
  if [ -n "$DATABASE_URL" ]; then
    echo "Using DATABASE_URL environment variable..."
    psql "$DATABASE_URL" -f "$SQL_FILE"
    
    if [ $? -eq 0 ]; then
      echo "Migrations completed successfully using psql."
      exit 0
    else
      echo "Error running migrations with psql."
    fi
  elif [ -n "$POSTGRES_URL" ]; then
    echo "Using POSTGRES_URL environment variable..."
    psql "$POSTGRES_URL" -f "$SQL_FILE"
    
    if [ $? -eq 0 ]; then
      echo "Migrations completed successfully using psql."
      exit 0
    else
      echo "Error running migrations with psql."
    fi
  else
    echo "No database connection URL found in environment variables."
    echo "Please set DATABASE_URL or POSTGRES_URL if you want to use psql."
  fi
fi

# Fall back to Node.js script
echo "Falling back to Node.js script..."
node scripts/run-usage-migrations.js

if [ $? -eq 0 ]; then
  echo "Migrations completed successfully using Node.js script."
  exit 0
else
  echo "Error running migrations with Node.js script."
  echo ""
  echo "Manual setup instructions:"
  echo "1. Go to your Supabase dashboard"
  echo "2. Open the SQL Editor"
  echo "3. Copy and paste the contents of $SQL_FILE"
  echo "4. Run the SQL"
  exit 1
fi 