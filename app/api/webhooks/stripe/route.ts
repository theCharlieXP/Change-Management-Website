import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { resetFeatureUsage, INSIGHT_SEARCH_FEATURE } from '@/lib/subscription';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit, getRateLimitConfig } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
  // Apply rate limiting for webhook calls
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown-ip';
  
  // Use a more permissive rate limit for Stripe webhooks
  const rateLimitConfig = {
    interval: 60 * 1000, // 1 minute
    limit: 100, // 100 requests per minute - Stripe can send multiple webhooks in bursts
  };
  
  const rateLimitResult = await rateLimit(ip.toString(), rateLimitConfig);
  
  // If rate limit exceeded, return 429 Too Many Requests
  if (!rateLimitResult.success) {
    console.error(`Rate limit exceeded for Stripe webhook from IP: ${ip}`);
    return NextResponse.json(
      { 
        error: 'Too many requests',
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset.toISOString()
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString()
        }
      }
    );
  }

  // Validate that webhook secret is configured
  if (!webhookSecret) {
    console.error('Stripe webhook secret is not set. Please set the STRIPE_WEBHOOK_SECRET environment variable.');
    return NextResponse.json(
      { error: 'Webhook secret is not configured' },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  
  if (!signature) {
    console.error('No Stripe signature found in the request headers');
    return NextResponse.json(
      { error: 'No Stripe signature found in the request headers' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Webhook received: ${event.type}`);
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Processing checkout.session.completed for session ${session.id}`);
        
        // Get customer details
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        if (!session.metadata?.userId) {
          console.error('No user ID in session metadata');
          return NextResponse.json(
            { error: 'No user ID in session metadata' },
            { status: 400 }
          );
        }

        const userId = session.metadata.userId;
        console.log(`User ID from session metadata: ${userId}`);

        // Get subscription details
        if (!subscriptionId) {
          console.error('No subscription ID in session');
          return NextResponse.json(
            { error: 'No subscription ID in session' },
            { status: 400 }
          );
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        
        console.log(`Updating user subscription for user ${userId} with subscription ${subscriptionId}`);
        
        // Update user subscription in database
        await updateUserSubscription(userId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          stripe_current_period_end: new Date(subscription.current_period_end * 1000),
          subscription_status: subscription.status,
          tier: 'pro', // Assuming all subscriptions are for the pro plan
        });

        // Reset usage counters
        await resetFeatureUsage(userId, INSIGHT_SEARCH_FEATURE);
        console.log(`Reset usage counters for user ${userId}`);

        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (!subscriptionId) {
          console.log('No subscription ID in invoice, skipping');
          break;
        }
        
        console.log(`Processing invoice.payment_succeeded for subscription ${subscriptionId}`);
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Find the customer in our database
        const customerId = subscription.customer as string;
        
        // Get the user ID from metadata
        const userId = subscription.metadata.userId;
        
        if (!userId) {
          console.error('No user ID in subscription metadata');
          break;
        }
        
        console.log(`Updating subscription for user ${userId} after successful payment`);
        
        // Update subscription in database
        await updateUserSubscription(userId, {
          stripe_current_period_end: new Date(subscription.current_period_end * 1000),
          subscription_status: subscription.status,
          tier: 'pro',
        });
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (!userId) {
          console.error('No user ID in subscription metadata');
          break;
        }
        
        console.log(`Processing subscription update for user ${userId}`);
        
        // Update subscription in database
        await updateUserSubscription(userId, {
          stripe_current_period_end: new Date(subscription.current_period_end * 1000),
          subscription_status: subscription.status,
          tier: 'pro',
        });
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (!userId) {
          console.error('No user ID in subscription metadata');
          break;
        }
        
        console.log(`Processing subscription deletion for user ${userId}`);
        
        // Update subscription in database
        await updateUserSubscription(userId, {
          subscription_status: 'canceled',
          tier: 'basic',
        });
        
        break;
      }
      
      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
} 