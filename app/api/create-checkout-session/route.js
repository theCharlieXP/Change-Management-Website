import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    // Get the authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Log environment variables (redacted for security)
    console.log('Base URL:', process.env.NEXT_PUBLIC_BASE_URL);
    console.log('Using Stripe API with key starting with:', 
      process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 8) + '...' : 'undefined');

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing Stripe secret key');
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }

    // For testing, we'll use a hardcoded base URL if the environment variable is not set
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Account Subscription',
              description: 'Unlimited access to Insight Search feature',
            },
            unit_amount: 1999, // $19.99
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    });

    console.log('Session created successfully. ID:', session.id);
    console.log('Checkout URL:', session.url); // Stripe provides a direct URL
    
    // Return both the session ID and the direct URL provided by Stripe
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url // This is the direct checkout URL from Stripe
    });
  } catch (err) {
    console.error('Stripe session creation error:', err);
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred while creating the checkout session';
    
    if (err instanceof Stripe.errors.StripeError) {
      errorMessage = `Stripe error: ${err.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 