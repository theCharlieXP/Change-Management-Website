'use client';

import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";

export default function SubscriptionUpgradeButton() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClick = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('Creating checkout session...');
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API response error:', response.status, errorData);
        setErrorMessage(`Server error: ${response.status}. Please try again later.`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Checkout session response:', data);

      if (data.error) {
        setErrorMessage(`Error: ${data.error}`);
        console.error('Error creating checkout session:', data.error);
        setIsLoading(false);
        return;
      }

      // Use the direct URL provided by Stripe if available
      if (data.url) {
        console.log('Using Stripe-provided checkout URL:', data.url);
        window.location.href = data.url;
        return;
      }
      
      // Fallback to constructing the URL ourselves
      const { sessionId } = data;
      if (!sessionId) {
        setErrorMessage('Failed to create checkout session.');
        setIsLoading(false);
        return;
      }

      console.log('Constructing checkout URL with session ID:', sessionId);
      const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
      console.log('Redirecting to:', checkoutUrl);
      window.location.href = checkoutUrl;
      
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setErrorMessage(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 transform hover:scale-[1.02] shadow-md"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </>
        )}
      </Button>
      
      {errorMessage && (
        <div className="mt-2 text-sm text-red-500">
          {errorMessage}
        </div>
      )}
    </div>
  );
} 