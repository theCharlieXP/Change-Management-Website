'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"

export function GetStartedButton() {
  return (
    <Link href="/sign-in">
      <Button 
        size="lg" 
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-6 text-lg shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
      >
        Get Started
      </Button>
    </Link>
  )
} 