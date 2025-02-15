-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    tier TEXT DEFAULT 'free',
    credits NUMERIC DEFAULT 100,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Create updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON profiles;

-- Create RLS policies
CREATE POLICY "Enable read access for own profile"
    ON profiles FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Enable insert access for own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Enable update access for own profile"
    ON profiles FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Create index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id); 