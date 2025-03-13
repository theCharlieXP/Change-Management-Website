-- Combined SQL file for all usage tracking migrations
-- You can run this file directly in your database if the migration script fails

-- Function to execute arbitrary SQL (create this first if it doesn't exist)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Function to increment usage for a specific feature
CREATE OR REPLACE FUNCTION increment_usage(p_user_id TEXT, p_feature_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if a record exists
  IF EXISTS (
    SELECT 1 FROM usage_tracker 
    WHERE user_id = p_user_id AND feature_id = p_feature_id
  ) THEN
    -- Update existing record
    UPDATE usage_tracker
    SET count = count + 1, updated_at = NOW()
    WHERE user_id = p_user_id AND feature_id = p_feature_id;
  ELSE
    -- Insert new record
    INSERT INTO usage_tracker (user_id, feature_id, count, last_reset)
    VALUES (p_user_id, p_feature_id, 1, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to reset usage for a specific feature
CREATE OR REPLACE FUNCTION reset_usage(p_user_id TEXT, p_feature_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if a record exists
  IF EXISTS (
    SELECT 1 FROM usage_tracker 
    WHERE user_id = p_user_id AND feature_id = p_feature_id
  ) THEN
    -- Update existing record
    UPDATE usage_tracker
    SET count = 0, last_reset = NOW()
    WHERE user_id = p_user_id AND feature_id = p_feature_id;
  ELSE
    -- Insert new record
    INSERT INTO usage_tracker (user_id, feature_id, count, last_reset)
    VALUES (p_user_id, p_feature_id, 0, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql; 