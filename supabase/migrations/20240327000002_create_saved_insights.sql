-- Drop the table if it exists
DROP TABLE IF EXISTS saved_insights CASCADE;

-- Create the saved_insights table
CREATE TABLE saved_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  summary TEXT,
  focus_area TEXT NOT NULL,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT saved_insights_user_id_not_empty CHECK (user_id <> ''),
  CONSTRAINT saved_insights_insight_id_not_empty CHECK (insight_id <> ''),
  CONSTRAINT saved_insights_unique_per_project UNIQUE (project_id, insight_id),
  CONSTRAINT saved_insights_focus_area_valid CHECK (
    focus_area IN (
      'challenges-barriers',
      'strategies-solutions',
      'outcomes-results',
      'key-stakeholders-roles',
      'best-practices-methodologies',
      'lessons-learned-insights',
      'implementation-tactics',
      'communication-engagement',
      'metrics-performance',
      'risk-management',
      'technology-tools',
      'cultural-transformation',
      'change-leadership',
      'employee-training',
      'change-sustainability'
    )
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_insights_user_id ON saved_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_insights_project_id ON saved_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_saved_insights_insight_id ON saved_insights(insight_id);
CREATE INDEX IF NOT EXISTS idx_saved_insights_created_at ON saved_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_insights_focus_area ON saved_insights(focus_area);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_saved_insights_updated_at ON saved_insights;
CREATE TRIGGER update_saved_insights_updated_at
  BEFORE UPDATE ON saved_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_insights_updated_at();

-- Disable RLS to allow service role access
ALTER TABLE saved_insights DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can access all saved insights" ON saved_insights;

-- Create policy for service role
CREATE POLICY "Service role can access all saved insights"
  ON saved_insights FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS but allow service role to bypass
ALTER TABLE saved_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_insights FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON saved_insights TO service_role;

-- Log table creation
DO $$ 
BEGIN 
  RAISE NOTICE 'Saved insights table created successfully with service role access';
END $$; 