import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incrementFeatureUsage, getFeatureUsage, INSIGHT_SEARCH_FEATURE } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const authData = await auth();
  const { userId } = authData;

  if (!userId) {
    console.error('Unauthorized access attempt to increment-usage');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { featureId } = await req.json();

    if (!featureId) {
      console.error(`Missing featureId parameter in request from user ${userId}`);
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }

    // Obtain current usage before incrementing for logging purposes
    const currentUsage = await getFeatureUsage(userId, featureId);
    console.log(`Current usage for ${featureId} by user ${userId}: ${currentUsage.count}/${currentUsage.limit}`);

    // Increment usage
    console.log(`Attempting to increment usage for feature ${featureId} for user ${userId}`);
    const result = await incrementFeatureUsage(featureId);
    
    // Log the result for debugging
    if (result.success) {
      console.log(`Successfully incremented usage for user ${userId}. New count: ${result.usage.count}/${result.usage.limit}`);
    } else {
      console.log(`Failed to increment usage for user ${userId}. Reason: limit reached or other error`);
    }
    
    return NextResponse.json({
      success: result.success,
      canUseFeature: result.canUseFeature,
      usage: result.usage
    });
  } catch (error: any) {
    console.error(`Error incrementing usage for user ${userId}:`, error);
    return NextResponse.json(
      { error: `Failed to increment usage: ${error.message}` },
      { status: 500 }
    );
  }
} 