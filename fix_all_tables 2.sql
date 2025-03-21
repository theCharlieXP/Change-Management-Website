-- Drop existing tables if they exist
DROP TABLE IF EXISTS "Project";
DROP TABLE IF EXISTS "SavedInsight";
DROP TABLE IF EXISTS "Category";
DROP TABLE IF EXISTS "Insight";
DROP TABLE IF EXISTS "UserSubscription";
DROP TABLE IF EXISTS "usage_tracker";

-- Create Project table
CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Create SavedInsight table
CREATE TABLE IF NOT EXISTS "SavedInsight" (
  "id" TEXT NOT NULL,
  "insightId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SavedInsight_pkey" PRIMARY KEY ("id")
);

-- Create Category table
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Create Insight table
CREATE TABLE IF NOT EXISTS "Insight" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tags" TEXT[] NOT NULL,
  "readTime" INTEGER NOT NULL,
  "source" TEXT,

  CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- Create UserSubscription table
CREATE TABLE IF NOT EXISTS "UserSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "stripePriceId" TEXT,
  "stripeCurrentPeriodEnd" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- Create usage_tracker table
CREATE TABLE IF NOT EXISTS "usage_tracker" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "featureId" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "usage_tracker_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "Project_userId_idx" ON "Project"("userId");
CREATE INDEX "SavedInsight_userId_idx" ON "SavedInsight"("userId");
CREATE INDEX "SavedInsight_projectId_idx" ON "SavedInsight"("projectId");
CREATE INDEX "SavedInsight_insightId_idx" ON "SavedInsight"("insightId");
CREATE INDEX "Insight_categoryId_idx" ON "Insight"("categoryId");
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");
CREATE INDEX "UserSubscription_stripeCustomerId_idx" ON "UserSubscription"("stripeCustomerId");
CREATE INDEX "UserSubscription_stripeSubscriptionId_idx" ON "UserSubscription"("stripeSubscriptionId");
CREATE INDEX "usage_tracker_userId_idx" ON "usage_tracker"("userId");
CREATE INDEX "usage_tracker_featureId_idx" ON "usage_tracker"("featureId");

-- Create unique constraints
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "usage_tracker_userId_featureId_key" ON "usage_tracker"("userId", "featureId");

-- Add foreign key constraints
ALTER TABLE "SavedInsight" ADD CONSTRAINT "SavedInsight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 