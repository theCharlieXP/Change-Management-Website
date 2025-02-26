'use client';

import { useState } from 'react';

export default function StripeTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const createCheckoutSession = async () => {
    setIsLoading(true);
    setError('');
    setSessionId('');
    setCheckoutUrl('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Checkout session response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Use the direct URL from Stripe if available
      if (data.url) {
        setCheckoutUrl(data.url);
        setSessionId(data.sessionId || '');
        console.log('Using Stripe-provided checkout URL:', data.url);
      } else if (data.sessionId) {
        // Fallback to constructing the URL
        const newSessionId = data.sessionId;
        setSessionId(newSessionId);
        setCheckoutUrl(`https://checkout.stripe.com/pay/${newSessionId}`);
      } else {
        throw new Error('No session ID or URL returned');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden p-8">
          <h1 className="text-2xl font-bold mb-6">Stripe Checkout Test</h1>
          
          <div className="mb-8">
            <button
              onClick={createCheckoutSession}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              {isLoading ? 'Creating Session...' : 'Create Checkout Session'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          
          {checkoutUrl && (
            <div className="mb-6">
              {sessionId && (
                <>
                  <h2 className="text-lg font-semibold mb-2">Session ID</h2>
                  <div className="bg-gray-100 p-3 rounded mb-4 font-mono text-sm overflow-x-auto">
                    {sessionId}
                  </div>
                </>
              )}
              
              <h2 className="text-lg font-semibold mb-2">Checkout URL</h2>
              <div className="bg-gray-100 p-3 rounded mb-4 font-mono text-sm overflow-x-auto break-all">
                {checkoutUrl}
              </div>
              
              <div className="flex flex-wrap gap-4">
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Open Checkout in New Tab
                </a>
                
                <button
                  onClick={() => window.location.href = checkoutUrl}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  Redirect to Checkout
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(checkoutUrl);
                    alert('Checkout URL copied to clipboard!');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Copy URL
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold mb-2">Test Card Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Card number: <code className="bg-gray-100 px-1">4242 4242 4242 4242</code></li>
              <li>Expiration date: Any future date</li>
              <li>CVC: Any 3 digits</li>
              <li>ZIP: Any 5 digits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 