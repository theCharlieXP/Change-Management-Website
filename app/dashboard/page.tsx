'use client'

import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()

  // Wait for the user data to load
  if (!isLoaded) {
    return null
  }

  // Redirect to projects page
  redirect('/dashboard/projects')
} 