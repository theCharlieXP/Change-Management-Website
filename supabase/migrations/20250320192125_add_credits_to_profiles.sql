-- Check if credits column exists and its type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'credits'
    ) THEN
        -- Add credits column if it doesn't exist
        ALTER TABLE profiles
        ADD COLUMN credits INTEGER DEFAULT 100;
    ELSE
        -- If it exists as NUMERIC, alter it to INTEGER
        ALTER TABLE profiles
        ALTER COLUMN credits TYPE INTEGER USING credits::INTEGER;
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN profiles.credits IS 'Number of credits available to the user';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_credits_idx ON profiles (credits); 