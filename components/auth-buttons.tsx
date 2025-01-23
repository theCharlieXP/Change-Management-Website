'use client'

import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function GetStartedButton() {
  return (
    <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
      <Button 
        size="lg" 
        className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105"
      >
        Get Started
      </Button>
    </SignInButton>
  )
} 