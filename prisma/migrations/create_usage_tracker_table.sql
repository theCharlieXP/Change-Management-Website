-- Create the usage_tracker table if it doesn't exist
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

-- Create an index on user_id and feature_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracker_user_feature ON usage_tracker(user_id, feature_id);

-- Add a comment to the table
COMMENT ON TABLE usage_tracker IS 'Tracks feature usage for users with daily limits'; 