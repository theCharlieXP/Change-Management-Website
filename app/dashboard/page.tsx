'use client'

import { useAuth } from '@clerk/nextjs'
import { ProfileCreator } from '@/components/auth/profile-creator'

export default function DashboardPage() {
  const { isLoaded, isSignedIn, userId } = useAuth()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in to access the dashboard.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <ProfileCreator />
      {/* Add your dashboard content here */}
    </div>
  )
} 