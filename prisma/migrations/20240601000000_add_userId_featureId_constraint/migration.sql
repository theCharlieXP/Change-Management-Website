-- Drop the existing unique constraint if it exists
ALTER TABLE "UsageTracker" DROP CONSTRAINT IF EXISTS "UsageTracker_userId_featureId_key";

-- Add the named unique constraint
ALTER TABLE "UsageTracker" ADD CONSTRAINT "userId_featureId" UNIQUE ("userId", "featureId"); 