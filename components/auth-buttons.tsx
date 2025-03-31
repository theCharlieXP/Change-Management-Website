'use client'

import { SignInButton, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function GetStartedButton() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <Link href="/dashboard/projects">
        <Button 
          size="lg" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
        >
          Get Started
        </Button>
      </Link>
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