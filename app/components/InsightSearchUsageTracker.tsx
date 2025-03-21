'use client';

import { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react'
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

  const fetchUsage = useCallback(async () => {
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
  }, [onUsageUpdate])

  useEffect(() => {
    if (user) {
      fetchUsage()
    }
  }, [user, fetchUsage])

  const incrementUsage = async () => {
    if (!user) return false

    try {
      const response = await fetch('/api/subscription/increment-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId: INSIGHT_SEARCH_FEATURE })
      })

      if (!response.ok) {
        console.error('Error incrementing usage: Server returned', response.status)
        return false
      }

      const data = await response.json()
      
      if (data.success) {
        // Handle different response formats
        const count = data.count || data.currentUsage || 0
        const limit = data.limit || 20
        const limitReached = data.limitReached !== undefined 
                            ? data.limitReached 
                            : (data.canUseFeature !== undefined ? !data.canUseFeature : false)
        const isPremium = data.isPremium || false
        
        setUsage({
          count,
          limit,
          limitReached,
          isPremium
        })
        
        if (onUsageUpdate) {
          onUsageUpdate(count, limit, limitReached, isPremium)
        }

        return !limitReached
      }
      
      return false
    } catch (error) {
      console.error('Error incrementing usage:', error)
      return false
    }
  }

  useImperativeHandle(ref, () => ({
    incrementUsage
  }))

  return null // This component doesn't render anything
})

InsightSearchUsageTracker.displayName = 'InsightSearchUsageTracker'

export default InsightSearchUsageTracker 