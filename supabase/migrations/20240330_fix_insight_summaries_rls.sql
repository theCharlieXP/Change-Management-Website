-- First disable RLS to allow service role access
ALTER TABLE insight_summaries DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own project's summaries" ON insight_summaries;
DROP POLICY IF EXISTS "Users can insert summaries into their own projects" ON insight_summaries;
DROP POLICY IF EXISTS "Users can update their own project's summaries" ON insight_summaries;
DROP POLICY IF EXISTS "Users can delete their own project's summaries" ON insight_summaries;

-- Create policy for service role
CREATE POLICY "Service role can access all insight summaries"
  ON insight_summaries FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS but allow service role to bypass
ALTER TABLE insight_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_summaries FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON insight_summaries TO service_role; 