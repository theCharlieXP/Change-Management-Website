import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureId } = await request.json();
    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    // Get current usage
    const currentUsage = await prisma.usageTracker.findFirst({
      where: {
        userId,
        featureId,
        date: new Date().toISOString().split('T')[0]
      }
    });

    // If no usage record exists for today, create one
    if (!currentUsage) {
      await prisma.usageTracker.create({
        data: {
          userId,
          featureId,
          count: 1,
          date: new Date().toISOString().split('T')[0]
        }
      });
      return NextResponse.json({ success: true, count: 1 });
    }

    // Check if user has reached their limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    const isPremium = user?.subscription?.tier === 'pro';
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
        count: currentUsage.count + 1
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