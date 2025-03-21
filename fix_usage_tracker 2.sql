-- Drop the old table if it exists
DROP TABLE IF EXISTS "usage_tracker";

-- Create the new table with the correct name
CREATE TABLE IF NOT EXISTS "usage_tracker" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "featureId" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "usage_tracker_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "userId_featureId" UNIQUE ("userId", "featureId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "usage_tracker_userId_idx" ON "usage_tracker"("userId");
CREATE INDEX IF NOT EXISTS "usage_tracker_featureId_idx" ON "usage_tracker"("featureId"); 