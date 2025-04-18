'use client';

import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';

export default function UpgradeButton() {
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
      
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrorMessage(`An unexpected error occurred: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-gray-400"
      >
        {isLoading ? 'Processing...' : 'Upgrade to Pro'}
      </button>
      
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Having trouble? <a 
          href="#" 
          className="text-blue-500 underline"
          onClick={(e) => {
            e.preventDefault();
            window.open('https://stripe.com/docs/testing#cards', '_blank');
          }}
        >
          Use these test card numbers
        </a></p>
      </div>
    </div>
  );
} 