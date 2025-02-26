import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getUserSubscription, getFeatureUsage, INSIGHT_SEARCH_FEATURE } from '@/lib/subscription';

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get subscription status
    const subscription = await getUserSubscription();
    
    // Get usage information for insight search
    const insightSearchUsage = await getFeatureUsage(userId, INSIGHT_SEARCH_FEATURE);

    return NextResponse.json({
      subscription,
      usage: {
        insightSearch: insightSearchUsage
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription information' },
      { status: 500 }
    );
  }
} 