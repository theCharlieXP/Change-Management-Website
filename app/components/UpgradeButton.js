'use client';

import { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';

export default function UpgradeButton() {
  const stripe = useStripe();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
      });

      const { sessionId, error } = await response.json();

      if (error) {
        console.error('Error creating checkout session:', error);
        setIsLoading(false);
        return;
      }

      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        console.error(result.error.message);
      }
    } catch (err) {
      console.error('Error:', err);
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
    >
      {isLoading ? 'Processing...' : 'Upgrade to Pro'}
    </button>
  );
} 