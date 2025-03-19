'use client';

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client'

interface UsageTrackerProps {
  onUsageUpdate?: (count: number, limit: number, limitReached: boolean, isPremium: boolean) => void;
}

interface UsageState {
  count: number;
  limit: number;
  limitReached: boolean;
  isPremium: boolean;
}

export interface UsageTrackerRef {
  incrementUsage: () => Promise<boolean>;
}

const InsightSearchUsageTracker = forwardRef<UsageTrackerRef, UsageTrackerProps>(({ onUsageUpdate }, ref) => {
  const { user } = useUser()
  const [usage, setUsage] = useState<UsageState>({ 
    count: 0, 
    limit: 20, 
    limitReached: false, 
    isPremium: false 
  })

  useEffect(() => {
    if (user) {
      fetchUsage()
    }
  }, [user])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/subscription/get-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ featureId: INSIGHT_SEARCH_FEATURE })
      })
      const data = await response.json()
      if (data.success) {
        setUsage({
          count: data.usage.count,
          limit: data.usage.limit,
          limitReached: data.usage.isLimitReached,
          isPremium: data.usage.isPremium
        })
        
        if (onUsageUpdate) {
          onUsageUpdate(data.usage.count, data.usage.limit, data.usage.isLimitReached, data.usage.isPremium)
        }
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
          count: data.currentUsage,
          limit: data.limit,
          limitReached: !data.canUseFeature,
          isPremium: data.isPremium
        })
        
        if (onUsageUpdate) {
          onUsageUpdate(data.currentUsage, data.limit, !data.canUseFeature, data.isPremium)
        }

        return data.canUseFeature
      }
    } catch (error) {
      console.error('Error incrementing usage:', error)
    }
    
    return false
  }

  useImperativeHandle(ref, () => ({
    incrementUsage
  }))

  return null // This component doesn't render anything
})

InsightSearchUsageTracker.displayName = 'InsightSearchUsageTracker'

export default InsightSearchUsageTracker 