import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incrementFeatureUsage, getFeatureUsage, INSIGHT_SEARCH_FEATURE } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const authData = await auth();
  const { userId } = authData;

  if (!userId) {
    console.error('[increment-usage] Unauthorized access attempt');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { featureId } = await req.json();

    if (!featureId) {
      console.error(`[increment-usage] Missing featureId parameter from user ${userId}`);
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }

    // Obtain current usage before incrementing for logging purposes
    console.log(`[increment-usage] Getting current usage for user ${userId}, feature ${featureId}`);
    const currentUsage = await getFeatureUsage(userId, featureId);
    console.log(`[increment-usage] Current usage: ${currentUsage.count}/${currentUsage.limit}`);

    // Check if user has already reached their limit
    if (currentUsage.isLimitReached) {
      console.log(`[increment-usage] User ${userId} has already reached their usage limit for ${featureId}`);
      return NextResponse.json({
        success: false,
        canUseFeature: false,
        usage: currentUsage
      });
    }

    // Increment usage
    console.log(`[increment-usage] Attempting to increment usage for user ${userId}`);
    const result = await incrementFeatureUsage(featureId);
    
    // Log the result for debugging
    if (result.success) {
      console.log(`[increment-usage] Successfully incremented usage. New count: ${result.usage.count}/${result.usage.limit}`);
      
      // Double-check that the count was actually incremented
      if (result.usage.count <= currentUsage.count) {
        console.warn(`[increment-usage] Warning: Usage count did not increase. Before: ${currentUsage.count}, After: ${result.usage.count}`);
        
        // Do an additional check by directly fetching the latest usage
        console.log(`[increment-usage] Verifying usage after increment...`);
        const verifiedUsage = await getFeatureUsage(userId, featureId);
        console.log(`[increment-usage] Verified usage: ${verifiedUsage.count}/${verifiedUsage.limit}`);
        
        // Use the verified usage if it's higher than what was returned from incrementFeatureUsage
        if (verifiedUsage.count > result.usage.count) {
          console.log(`[increment-usage] Using verified count (${verifiedUsage.count}) instead of result count (${result.usage.count})`);
          result.usage = verifiedUsage;
        }
        
        // If we still don't see an increment, force a manual increment
        if (verifiedUsage.count <= currentUsage.count) {
          console.warn(`[increment-usage] Still no increment detected. Forcing a count of ${currentUsage.count + 1}`);
          result.usage.count = currentUsage.count + 1;
          result.usage.remaining = Math.max(0, result.usage.limit - result.usage.count);
          result.usage.isLimitReached = result.usage.count >= result.usage.limit;
        }
      }
    } else {
      console.log(`[increment-usage] Failed to increment usage. Reason: ${result.usage.isLimitReached ? 'limit reached' : 'other error'}`);
    }
    
    return NextResponse.json({
      success: result.success,
      canUseFeature: result.canUseFeature,
      usage: result.usage
    });
  } catch (error: any) {
    console.error(`[increment-usage] Error for user ${userId}:`, error);
    return NextResponse.json(
      { error: `Failed to increment usage: ${error.message}` },
      { status: 500 }
    );
  }
} 