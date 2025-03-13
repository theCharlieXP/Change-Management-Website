-- Function to execute arbitrary SQL
-- This is needed if your Supabase instance doesn't have the exec_sql function
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 