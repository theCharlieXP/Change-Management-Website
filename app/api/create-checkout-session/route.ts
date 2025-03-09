import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

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

export async function POST(req: NextRequest) {
  const authData = await auth();
const { userId  } = authData;

  if (!userId) {
    console.error('Unauthorized access attempt to create-checkout-session');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!priceId) {
    console.error('NEXT_PUBLIC_STRIPE_PRICE_ID is not configured');
    return NextResponse.json(
      { error: 'Stripe price ID is not configured' },
      { status: 500 }
    );
  }

  try {
    console.log(`Creating checkout session for user ${userId}`);
    
    // Get user from Supabase
    const supabase = createSupabaseClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.error(`Error fetching profile for user ${userId}:`, profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    let customerId = profile?.stripe_customer_id;
    
    // If user doesn't have a Stripe customer ID, create one
    if (!customerId) {
      console.log(`Creating new Stripe customer for user ${userId}`);
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        console.error(`Error fetching user data for ${userId}:`, userError);
        return NextResponse.json(
          { error: 'Failed to fetch user data' },
          { status: 500 }
        );
      }
      
      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: {
          userId: userId,
        },
      });
      
      customerId = customer.id;
      
      // Update user profile with Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error(`Error updating profile with Stripe customer ID for user ${userId}:`, updateError);
        // Continue with checkout even if update fails, we'll try again later
      } else {
        console.log(`Updated profile with Stripe customer ID ${customerId} for user ${userId}`);
      }
    } else {
      console.log(`Using existing Stripe customer ${customerId} for user ${userId}`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/account`,
      metadata: {
        userId: userId,
      },
    });

    console.log(`Created checkout session ${session.id} for user ${userId}`);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    );
  }
} 