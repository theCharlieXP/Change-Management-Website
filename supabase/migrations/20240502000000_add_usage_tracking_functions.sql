-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id TEXT,
  p_feature_id TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracker (user_id, feature_id, count, last_used_at, updated_at)
  VALUES (p_user_id, p_feature_id, 1, NOW(), NOW())
  ON CONFLICT (user_id, feature_id)
  DO UPDATE SET
    count = usage_tracker.count + 1,
    last_used_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset usage
CREATE OR REPLACE FUNCTION reset_usage(
  p_user_id TEXT,
  p_feature_id TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracker (user_id, feature_id, count, last_used_at, updated_at)
  VALUES (p_user_id, p_feature_id, 0, NOW(), NOW())
  ON CONFLICT (user_id, feature_id)
  DO UPDATE SET
    count = 0,
    last_used_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get usage
CREATE OR REPLACE FUNCTION get_usage(
  p_user_id TEXT,
  p_feature_id TEXT
)
RETURNS TABLE (
  count INTEGER,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ut.count,
    ut.last_used_at,
    ut.created_at,
    ut.updated_at
  FROM
    usage_tracker ut
  WHERE
    ut.user_id = p_user_id
    AND ut.feature_id = p_feature_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 