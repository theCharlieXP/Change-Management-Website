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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_communications_user_id ON saved_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_communications_project_id ON saved_communications(project_id);
CREATE INDEX IF NOT EXISTS idx_saved_communications_created_at ON saved_communications(created_at DESC);

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