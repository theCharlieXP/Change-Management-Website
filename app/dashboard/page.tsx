'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to projects page
    router.push('/dashboard/projects')
  }, [router])

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p>Redirecting to projects...</p>
        </div>
      </div>
    </DashboardLayout>
  )
} 