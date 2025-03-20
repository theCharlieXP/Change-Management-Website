-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create policies for Clerk authentication
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Ensure service role has full access
GRANT ALL ON profiles TO service_role; 