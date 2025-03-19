'use client';

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client'

export default function InsightSearchUsageTracker({ onUsageUpdate }) {
  const { user } = useUser()
  const [usage, setUsage] = useState({ count: 0, limit: 20, limitReached: false, isPremium: false })

  useEffect(() => {
    if (user) {
      fetchUsage()
    }
  }, [user])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/subscription/usage')
      const data = await response.json()
      if (data.success) {
        setUsage({
          count: data.usage.count,
          limit: data.usage.limit,
          limitReached: data.usage.limitReached,
          isPremium: data.usage.isPremium
        })
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

  const incrementUsage = async () => {
    if (!user) return false

    try {
      const response = await fetch('/api/subscription/increment-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId: INSIGHT_SEARCH_FEATURE })
      })

      const data = await response.json()
      
      if (data.success) {
        setUsage({
          count: data.count,
          limit: data.limit,
          limitReached: data.limitReached,
          isPremium: data.isPremium
        })
        
        if (onUsageUpdate) {
          onUsageUpdate(data.count, data.limit, data.limitReached, data.isPremium)
        }

        return !data.limitReached
      }
    } catch (error) {
      console.error('Error incrementing usage:', error)
    }
    
    return false
  }

  return null // This component doesn't render anything
} 