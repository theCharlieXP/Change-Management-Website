'use client'

import { SignUp } from "@clerk/nextjs"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white shadow-xl",
          }
        }}
        redirectUrl="/dashboard"
      />
      
      <div className="mt-4 text-center text-sm text-muted-foreground max-w-md">
        <p>
          By creating an account, you agree to our{" "}
          <Link href="/terms-of-service" className="text-emerald-600 hover:underline" target="_blank">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="text-emerald-600 hover:underline" target="_blank">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
} 