'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import UpgradeButton from '../components/UpgradeButton';

// Move stripe initialization here instead of importing from lib/stripe
// This ensures we only load Stripe once when the component mounts
export default function UpgradePage() {
  const [stripePromise, setStripePromise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize Stripe when the component mounts
    async function initializeStripe() {
      try {
        setIsLoading(true);
        
        // Check if the publishable key is available
        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          console.error('Stripe publishable key is not set');
          setError('Stripe configuration error. Please check your environment variables.');
          setIsLoading(false);
          return;
        }
        
        // Load Stripe
        console.log('Loading Stripe with key starting with:', 
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8) + '...');
        
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        
        if (stripe) {
          console.log('Stripe loaded successfully');
          setStripePromise(stripe);
        } else {
          console.error('Failed to load Stripe');
          setError('Failed to initialize payment system. Please try again later.');
        }
      } catch (err) {
        console.error('Error initializing Stripe:', err);
        setError('Error initializing payment system: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    initializeStripe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade to Pro
          </h1>
          <p className="text-gray-600 mb-8">
            Get unlimited access to Insight Search and other premium features.
          </p>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Pro Plan Benefits</h2>
            <ul className="text-left space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Unlimited Insight Searches</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Priority Support</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Advanced Analytics</span>
              </li>
            </ul>
          </div>
          
          <div className="text-2xl font-bold mb-6">$19.99</div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading payment system...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 py-4">{error}</div>
          ) : stripePromise ? (
            <Elements stripe={stripePromise}>
              <UpgradeButton />
            </Elements>
          ) : (
            <div className="text-red-500 py-4">
              Unable to initialize payment system. Please refresh the page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 