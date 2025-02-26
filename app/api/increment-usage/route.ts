import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { incrementFeatureUsage, INSIGHT_SEARCH_FEATURE } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    console.error('Unauthorized access attempt to increment-usage');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { feature } = await req.json();

    if (!feature) {
      console.error(`Missing feature parameter in request from user ${userId}`);
      return NextResponse.json(
        { error: 'Feature parameter is required' },
        { status: 400 }
      );
    }

    if (feature !== INSIGHT_SEARCH_FEATURE) {
      console.error(`Invalid feature parameter: ${feature} from user ${userId}`);
      return NextResponse.json(
        { error: 'Invalid feature parameter' },
        { status: 400 }
      );
    }

    console.log(`Incrementing usage for feature ${feature} for user ${userId}`);
    
    const result = await incrementFeatureUsage(userId, feature);
    
    if (result.error) {
      console.error(`Error incrementing usage for user ${userId}:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    console.log(`Successfully incremented usage for user ${userId}. Current usage: ${result.currentUsage}, limit: ${result.limit}`);
    
    return NextResponse.json({
      success: true,
      currentUsage: result.currentUsage,
      limit: result.limit,
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