-- Drop existing profiles table if it exists
DROP TABLE IF EXISTS "profiles";

-- Create profiles table
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "tier" TEXT NOT NULL DEFAULT 'basic',
  "subscription_status" TEXT NOT NULL DEFAULT 'inactive',
  "stripe_current_period_end" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on user_id
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- Create index on user_id for faster lookups
CREATE INDEX "profiles_user_id_idx" ON "profiles"("user_id");

-- Add RLS policies
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON "profiles"
  FOR SELECT USING (auth.uid()::text = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON "profiles"
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Allow service role to do everything
CREATE POLICY "Service role has full access" ON "profiles"
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role'); 