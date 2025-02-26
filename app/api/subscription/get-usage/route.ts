import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getFeatureUsage } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  try {
    // Get the user ID from the auth session
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the feature ID from the request body
    const body = await req.json();
    const { featureId } = body;

    if (!featureId) {
      return NextResponse.json(
        { error: 'Missing featureId' },
        { status: 400 }
      );
    }

    // Get the feature usage information
    const usage = await getFeatureUsage(userId, featureId);
    
    // Return the usage information
    return NextResponse.json({
      success: true,
      usage: {
        count: usage.count,
        limit: usage.limit,
        remaining: usage.remaining,
        isLimitReached: usage.isLimitReached,
        isPremium: usage.isPremium,
        canUseFeature: usage.canUseFeature
      }
    });
  } catch (error: any) {
    console.error('Error getting feature usage:', error);
    return NextResponse.json(
      { error: `Failed to get usage: ${error.message}` },
      { status: 500 }
    );
  }
} 