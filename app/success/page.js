'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Success() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Here you would typically verify the session and update the user's account status
      console.log('Payment successful, session ID:', sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Thank you for upgrading!
          </h1>
          <p className="text-gray-600 mb-8">
            Your account has been successfully upgraded to Pro status.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 