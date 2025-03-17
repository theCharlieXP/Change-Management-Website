import { NextResponse } from 'next/server';
import Stripe from 'stripe';
// No auth import to bypass authentication

export const dynamic = 'force-dynamic';

// Make this route public by not using auth middleware
export async function GET() {
  // Check if environment variables are properly set
  const config = {
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceId: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  };

  // Redacted key portions for debugging
  const redactedPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    ? `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8)}...` 
    : 'not set';
  
  const redactedSecretKey = process.env.STRIPE_SECRET_KEY
    ? `${process.env.STRIPE_SECRET_KEY.substring(0, 8)}...`
    : 'not set';

  // Check if keys are in production mode
  const isProductionMode = {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_'),
    secretKey: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
  };

  // Verify Stripe connection
  let stripeConnectionStatus = 'unknown';
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // Make a simple API call to verify the key works
      const balance = await stripe.balance.retrieve();
      stripeConnectionStatus = 'success';
    } else {
      stripeConnectionStatus = 'missing_key';
    }
  } catch (error) {
    stripeConnectionStatus = `error: ${error.message}`;
  }

  // Return redacted info for debugging purposes
  return NextResponse.json({
    config,
    isProductionMode,
    stripeConnectionStatus,
    debug: {
      publishableKeyPrefix: redactedPublishableKey,
      secretKeyPrefix: redactedSecretKey,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
      nodeEnv: process.env.NODE_ENV,
    }
  });
} 