'use client'

import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none",
          },
        }}
        fallbackRedirectUrl="/dashboard/projects"
      />
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-500">
        By continuing, you agree to our{" "}
        <a href="/terms" className="text-emerald-600 hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-emerald-600 hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  )
} 