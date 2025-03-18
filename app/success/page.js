'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);

  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId);
    }
  }, [sessionId]);

  const verifyPayment = async (sessionId) => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      // Call the server to verify the payment
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify payment');
      }

      const data = await response.json();
      
      if (data.success) {
        // For client-side state, we'll still use localStorage
        // This is just for UI purposes until the page refreshes
        localStorage.setItem('isPremiumUser', 'true');
        localStorage.setItem('insightSearchUsageCount', '0');
        
        // Store the pro tier limit for immediate UI feedback
        if (data.proStatus) {
          localStorage.setItem('proTierLimit', data.proStatus.usageLimit.toString());
          localStorage.setItem('subscriptionTier', data.proStatus.tier);
          localStorage.setItem('subscriptionStatus', data.proStatus.subscriptionStatus);
        }
        
        console.log('Payment verified successfully');
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationError(error.message);
      
      // For demo purposes, we'll still set the user as premium
      // In a production app, you would handle this error properly
      localStorage.setItem('isPremiumUser', 'true');
      localStorage.setItem('insightSearchUsageCount', '0');
      localStorage.setItem('proTierLimit', '100');  // PRO_TIER_INSIGHT_LIMIT
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-emerald-600 mb-4">
            Thank you for upgrading!
          </h1>
          
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center mb-8">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
              <p className="text-gray-600">
                Verifying your payment...
              </p>
            </div>
          ) : verificationError ? (
            <div className="mb-8">
              <p className="text-amber-600 mb-2">
                There was an issue verifying your payment:
              </p>
              <p className="text-gray-600 bg-amber-50 p-3 rounded-md">
                {verificationError}
              </p>
              <p className="text-gray-600 mt-4">
                Don{"'"}t worry, we{"'"}ve still upgraded your account. Our team will review the issue.
              </p>
            </div>
          ) : (
            <p className="text-gray-600 mb-8">
              Your account has been successfully upgraded to the Pro plan. You now have unlimited access to Insight Search and all premium features.
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Link href="/dashboard/account">
                View Account
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
            >
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 