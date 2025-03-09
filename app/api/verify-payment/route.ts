import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { resetFeatureUsage, INSIGHT_SEARCH_FEATURE } from '@/lib/subscription';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create Supabase client
const createSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
};

// Update user subscription in Supabase profiles table
async function updateUserSubscription(
  userId: string,
  data: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_price_id?: string;
    stripe_current_period_end?: Date;
    subscription_status: string;
    tier: string;
  }
) {
  const supabase = createSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    console.log(`Successfully updated subscription for user ${userId} with status ${data.subscription_status} and tier ${data.tier}`);
  } catch (error) {
    console.error('Error in updateUserSubscription:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const authData = await auth();
const { userId  } = authData;

  if (!userId) {
    console.error('Unauthorized access attempt to verify-payment');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      console.error('Missing sessionId in request');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`Verifying payment for session ${sessionId} for user ${userId}`);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(`Session retrieved: ${session.id}, payment status: ${session.payment_status}`);

    // Verify that the session was successful
    if (session.payment_status !== 'paid') {
      console.error(`Payment not completed for session ${sessionId}, status: ${session.payment_status}`);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Verify that the session belongs to the current user
    if (session.metadata?.userId !== userId) {
      console.error(`Session ${sessionId} does not belong to user ${userId}, belongs to ${session.metadata?.userId}`);
      return NextResponse.json(
        { error: 'Session does not belong to the current user' },
        { status: 403 }
      );
    }

    // Get subscription details if this was a subscription
    if (session.mode === 'subscription' && session.subscription) {
      console.log(`Processing subscription payment for session ${sessionId}`);
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0].price.id;
      
      console.log(`Updating user subscription for user ${userId} with subscription ${subscription.id}`);
      
      // Update user subscription in database
      await updateUserSubscription(userId, {
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        stripe_current_period_end: new Date(subscription.current_period_end * 1000),
        subscription_status: subscription.status,
        tier: 'pro',
      });
    } else {
      // For one-time payments, just mark the user as pro
      console.log(`Processing one-time payment for session ${sessionId}`);
      await updateUserSubscription(userId, {
        stripe_customer_id: session.customer as string,
        subscription_status: 'active',
        tier: 'pro',
      });
    }

    // Reset usage counters
    await resetFeatureUsage(userId, INSIGHT_SEARCH_FEATURE);
    console.log(`Reset usage counters for user ${userId}`);

    return NextResponse.json({
      success: true,
      isPremium: true,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: `Failed to verify payment: ${error.message}` },
      { status: 500 }
    );
  }
} 