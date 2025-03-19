import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { incrementFeatureUsage, INSIGHT_SEARCH_FEATURE } from '@/lib/subscription';

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
        { error: 'FeatureId parameter is required' },
        { status: 400 }
      );
    }

    if (featureId !== INSIGHT_SEARCH_FEATURE) {
      console.error(`Invalid featureId parameter: ${featureId} from user ${userId}`);
      return NextResponse.json(
        { error: 'Invalid featureId parameter' },
        { status: 400 }
      );
    }

    console.log(`Incrementing usage for feature ${featureId} for user ${userId}`);
    
    const result = await incrementFeatureUsage(featureId);
    
    if (!result.success) {
      console.error(`Error incrementing usage for user ${userId}:`, result.usage);
      return NextResponse.json(
        { error: "Failed to increment usage" },
        { status: 500 }
      );
    }
    
    console.log(`Successfully incremented usage for user ${userId}. Current usage: ${result.usage.count}, limit: ${result.usage.limit}`);
    
    return NextResponse.json({
      success: true,
      currentUsage: result.usage.count,
      limit: result.usage.limit,
      canUseFeature: result.canUseFeature,
    });
  } catch (error: any) {
    console.error(`Error incrementing usage for user ${userId}:`, error);
    return NextResponse.json(
      { error: `Failed to increment usage: ${error.message}` },
      { status: 500 }
    );
  }
} 