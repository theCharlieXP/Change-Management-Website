# Usage Tracking Setup

This document explains how to set up the usage tracking feature for the Change Management Website.

## What is Usage Tracking?

The usage tracking feature limits the number of operations users can perform:

- **Free users**: Limited to 20 insight searches per day
- **Pro users**: Limited to 100 insight searches per day
- **All users**: Limited to 100 Deep Seek operations per day (for communications)

## Setup Options

There are several ways to set up the usage tracking feature:

### Option 1: Using the Admin UI (Recommended)

1. Log in to the application
2. Navigate to `/dashboard/admin/setup-usage-tracking`
3. Click the "Setup Usage Tracking" button
4. Wait for the setup to complete

### Option 2: Using the Command Line

Run one of the following commands:

```bash
# Using the shell script (recommended for Unix/Linux/Mac)
npm run setup-usage-tracking

# Using Node.js directly
npm run setup-usage-tracking:node

# If you have psql installed and DATABASE_URL set
DATABASE_URL=your_database_url psql -f prisma/migrations/all_usage_migrations.sql
```

### Option 3: Manual Setup

If the automated methods fail, you can run the SQL manually:

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `prisma/migrations/all_usage_migrations.sql`
4. Run the SQL

## Troubleshooting

### "Error: Load failed" when running setup-usage-tracking

This error can occur for several reasons:

1. **Missing environment variables**: Make sure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in your `.env` file.

2. **Permissions issue**: The service role key might not have permission to execute SQL. Try using the manual setup method.

3. **Missing `exec_sql` function**: The `exec_sql` RPC function might not be available in your Supabase instance. The migration script now tries to create this function first, but if it fails, try using the manual setup method.

### Using psql directly

If you have psql installed, you can run the migrations directly:

```bash
# Set your database URL
export DATABASE_URL=postgres://username:password@host:port/database

# Run the migrations
psql $DATABASE_URL -f prisma/migrations/all_usage_migrations.sql
```

### Verifying the Setup

To verify that the setup was successful:

1. Check if the `usage_tracker` table exists in your database
2. Try using the insight search or Deep Seek features
3. Check if the usage count increases in the `usage_tracker` table

## Database Schema

The usage tracking feature uses the following database schema:

```sql
CREATE TABLE IF NOT EXISTS usage_tracker (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  feature_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_id)
);
```

## Feature IDs

The following feature IDs are used:

- `insight_search`: For tracking insight searches
- `deep_seek`: For tracking Deep Seek operations in communications

## Daily Reset

Usage counts are automatically reset at midnight UTC. This is handled by the `shouldResetUsage` function in `lib/subscription.ts`, which checks if the last reset date is from a previous day. 