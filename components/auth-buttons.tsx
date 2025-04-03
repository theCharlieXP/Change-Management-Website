'use client'

import { SignInButton, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function GetStartedButton() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard/projects');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <Button 
        size="lg" 
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
        disabled
      >
        Loading...
      </Button>
    );
  }

  if (isSignedIn) {
    return (
      <Button 
        size="lg" 
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
        onClick={() => router.push('/dashboard/projects')}
      >
        Go to Dashboard
      </Button>
    );
  }

  return (
    <SignInButton mode="modal" fallbackRedirectUrl="/dashboard/projects">
      <Button 
        size="lg" 
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
      >
        Get Started
      </Button>
    </SignInButton>
  );
} 