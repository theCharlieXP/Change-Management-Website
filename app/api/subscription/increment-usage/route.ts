import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { incrementFeatureUsage, getFeatureUsage } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { featureId } = await req.json();

    if (!featureId) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }

    // Increment usage
    const result = await incrementFeatureUsage(featureId);
    
    return NextResponse.json({
      success: result.success,
      canUseFeature: result.canUseFeature,
      usage: result.usage
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    );
  }
} 