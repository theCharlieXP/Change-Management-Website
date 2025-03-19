import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[increment-usage] Starting request processing');
    
    const authData = await auth();
    if (!authData.userId) {
      console.log('[increment-usage] No userId found in auth data');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[increment-usage] Authenticated user: ${authData.userId}`);

    const { featureId } = await request.json();
    if (!featureId) {
      console.log('[increment-usage] No featureId provided in request body');
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }
    console.log(`[increment-usage] Processing feature: ${featureId}`);

    // Get current usage for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('[increment-usage] Fetching current usage');
    const currentUsage = await prisma.usageTracker.findFirst({
      where: {
        userId: authData.userId,
        featureId,
        lastUsedAt: {
          gte: today
        }
      }
    });
    console.log(`[increment-usage] Current usage: ${JSON.stringify(currentUsage)}`);

    // If no usage record exists for today, create one
    if (!currentUsage) {
      console.log('[increment-usage] No usage record found, creating new record');
      const newUsage = await prisma.usageTracker.create({
        data: {
          userId: authData.userId,
          featureId,
          count: 1,
          lastUsedAt: new Date()
        }
      });
      console.log(`[increment-usage] Created new usage record: ${JSON.stringify(newUsage)}`);
      return NextResponse.json({ success: true, count: 1 });
    }

    // Check if user has reached their limit
    console.log('[increment-usage] Checking user subscription');
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { 
        userId: authData.userId,
        status: 'active'
      }
    });
    console.log(`[increment-usage] User subscription: ${JSON.stringify(userSubscription)}`);

    const isPremium = userSubscription?.plan === 'pro';
    const limit = isPremium ? 100 : 20; // Pro users get 100 searches, free users get 20
    console.log(`[increment-usage] User limit: ${limit} (Premium: ${isPremium})`);

    if (currentUsage.count >= limit) {
      console.log(`[increment-usage] User has reached limit: ${currentUsage.count}/${limit}`);
      return NextResponse.json({ 
        success: true, 
        count: currentUsage.count,
        limitReached: true,
        limit
      });
    }

    // Increment usage
    console.log('[increment-usage] Incrementing usage count');
    const updatedUsage = await prisma.usageTracker.update({
      where: {
        id: currentUsage.id
      },
      data: {
        count: currentUsage.count + 1,
        lastUsedAt: new Date()
      }
    });
    console.log(`[increment-usage] Updated usage: ${JSON.stringify(updatedUsage)}`);

    return NextResponse.json({ 
      success: true, 
      count: updatedUsage.count,
      limitReached: updatedUsage.count >= limit,
      limit
    });

  } catch (error: any) {
    console.error('[increment-usage] Error details:', {
      name: error?.name || 'Unknown',
      message: error?.message || 'An unknown error occurred',
      stack: error?.stack || 'No stack trace available'
    });
    return NextResponse.json({ 
      error: 'Failed to increment usage',
      details: error?.message || 'An unknown error occurred'
    }, { status: 500 });
  }
} 