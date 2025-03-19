import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authData = await auth();
    if (!authData.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureId } = await request.json();
    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    // Get current usage for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentUsage = await prisma.usageTracker.findFirst({
      where: {
        userId: authData.userId,
        featureId,
        lastUsedAt: {
          gte: today
        }
      }
    });

    // If no usage record exists for today, create one
    if (!currentUsage) {
      await prisma.usageTracker.create({
        data: {
          userId: authData.userId,
          featureId,
          count: 1,
          lastUsedAt: new Date()
        }
      });
      return NextResponse.json({ success: true, count: 1 });
    }

    // Check if user has reached their limit
    const userSubscription = await prisma.userSubscription.findFirst({
      where: { 
        userId: authData.userId,
        status: 'active'
      }
    });

    const isPremium = userSubscription?.plan === 'pro';
    const limit = isPremium ? 100 : 20; // Pro users get 100 searches, free users get 20

    if (currentUsage.count >= limit) {
      return NextResponse.json({ 
        success: true, 
        count: currentUsage.count,
        limitReached: true,
        limit
      });
    }

    // Increment usage
    const updatedUsage = await prisma.usageTracker.update({
      where: {
        id: currentUsage.id
      },
      data: {
        count: currentUsage.count + 1,
        lastUsedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      count: updatedUsage.count,
      limitReached: updatedUsage.count >= limit,
      limit
    });

  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json({ error: 'Failed to increment usage' }, { status: 500 });
  }
} 