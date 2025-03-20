-- Add credits column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 100;

-- Add comment to the column
COMMENT ON COLUMN profiles.credits IS 'Number of credits available to the user';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_credits_idx ON profiles (credits); 