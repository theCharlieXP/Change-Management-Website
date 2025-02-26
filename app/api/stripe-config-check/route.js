import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are properly set
  const config = {
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  };

  // Redacted key portions for debugging
  const redactedPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    ? `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8)}...` 
    : 'not set';
  
  const redactedSecretKey = process.env.STRIPE_SECRET_KEY
    ? `${process.env.STRIPE_SECRET_KEY.substring(0, 8)}...`
    : 'not set';

  // Return redacted info for debugging purposes
  return NextResponse.json({
    config,
    debug: {
      publishableKeyPrefix: redactedPublishableKey,
      secretKeyPrefix: redactedSecretKey,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
      nodeEnv: process.env.NODE_ENV,
    }
  });
} 