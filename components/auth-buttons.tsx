'use client'

import { SignInButton, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function GetStartedButton() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  if (isSignedIn) {
    return (
      <Button 
        size="lg" 
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
        onClick={() => router.push('/dashboard/projects')}
      >
        Get Started
      </Button>
    );
  }

  return (
    <SignInButton mode="modal" redirectUrl="/dashboard/projects">
      <Button 
        size="lg" 
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
      >
        Get Started
      </Button>
    </SignInButton>
  );
} 