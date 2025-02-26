-- Add Stripe fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'basic';

-- Add comments to the new columns
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for the user';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID for the user';
COMMENT ON COLUMN profiles.stripe_price_id IS 'Stripe price ID for the user subscription';
COMMENT ON COLUMN profiles.stripe_current_period_end IS 'When the current billing period ends';
COMMENT ON COLUMN profiles.subscription_status IS 'Status of the subscription (active, inactive, canceled, etc.)';
COMMENT ON COLUMN profiles.tier IS 'User tier (basic, pro)';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON profiles (stripe_customer_id);
CREATE INDEX IF NOT EXISTS profiles_stripe_subscription_id_idx ON profiles (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS profiles_tier_idx ON profiles (tier);

-- Create usage_tracker table
CREATE TABLE IF NOT EXISTS usage_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  feature_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, feature_id)
);

-- Add indexes for usage_tracker
CREATE INDEX IF NOT EXISTS usage_tracker_user_id_idx ON usage_tracker (user_id);
CREATE INDEX IF NOT EXISTS usage_tracker_feature_id_idx ON usage_tracker (feature_id);

-- Add comments to usage_tracker
COMMENT ON TABLE usage_tracker IS 'Tracks usage of features by users';
COMMENT ON COLUMN usage_tracker.user_id IS 'The user ID';
COMMENT ON COLUMN usage_tracker.feature_id IS 'The feature ID (e.g., insight_search)';
COMMENT ON COLUMN usage_tracker.count IS 'Number of times the feature has been used';
COMMENT ON COLUMN usage_tracker.last_used_at IS 'When the feature was last used'; 