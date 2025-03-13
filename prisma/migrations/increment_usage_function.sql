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