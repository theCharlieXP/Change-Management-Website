'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CreditCard, AlertCircle } from 'lucide-react';
import { INSIGHT_SEARCH_FEATURE, FREE_TIER_LIMIT, PRO_TIER_INSIGHT_LIMIT } from '@/lib/subscription-client';

// Create a wrapper component to handle the function children
const ChildrenRenderer = memo(({ render, props }) => {
  if (typeof render === 'function') {
    return render(props);
  }
  return render;
});
ChildrenRenderer.displayName = 'ChildrenRenderer';

export default function InsightSearchUsageTracker({ children }) {
  const router = useRouter();
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(FREE_TIER_LIMIT);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Load initial usage from localStorage for immediate UI feedback
    const storedUsageCount = localStorage.getItem('insightSearchUsageCount');
    if (storedUsageCount) {
      setUsageCount(parseInt(storedUsageCount, 10));
    }
    
    // Check if user is premium
    const storedIsPremium = localStorage.getItem('isPremiumUser') === 'true';
    if (storedIsPremium) {
      setIsPremium(true);
      // Check if we have a stored pro tier limit
      const storedProTierLimit = localStorage.getItem('proTierLimit');
      if (storedProTierLimit) {
        setUsageLimit(parseInt(storedProTierLimit, 10));
      } else {
        setUsageLimit(PRO_TIER_INSIGHT_LIMIT);
      }
    }
    
    // Fetch actual usage from server
    fetchUsage();
    
    // Set up an interval to periodically refresh usage data in the background
    // This ensures that if multiple tabs/sessions are open, they all stay in sync
    const refreshInterval = setInterval(() => {
      // Only do the silent refresh if the component is still mounted
      fetchUsage(true); // true = silent refresh (no console logs)
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchUsage = async (silent = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[fetchUsage] Starting usage fetch...');
      const response = await fetch('/api/subscription');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch usage: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[fetchUsage] Received data:', data);
      
      if (data.success) {
        // Update local state with server data
        const serverCount = data.usage.count || 0;
        console.log('[fetchUsage] Setting usage count from server:', serverCount);
        
        // Only update if the server count is different to avoid unnecessary renders
        if (serverCount !== usageCount) {
          console.log('[fetchUsage] Updating usage count from', usageCount, 'to', serverCount);
          setUsageCount(serverCount);
          
          // Update localStorage for UI consistency
          localStorage.setItem('insightSearchUsageCount', serverCount.toString());
          
          // Dispatch an event to notify other components of the usage update
          const eventDetail = { 
            count: serverCount,
            remainingSearches: Math.max(0, (isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT) - serverCount),
            isLimitReached: isPremium ? 
              serverCount >= PRO_TIER_INSIGHT_LIMIT : 
              serverCount >= FREE_TIER_LIMIT
          };
          console.log('[fetchUsage] Dispatching usage update event:', eventDetail);
          document.dispatchEvent(new CustomEvent('insightUsageUpdated', { detail: eventDetail }));
        }
        
        // If user has premium, update the limit
        if (data.usage.isPremium) {
          console.log('[fetchUsage] User is premium, updating limit');
          setIsPremium(true);
          const premiumLimit = data.usage.limit || PRO_TIER_INSIGHT_LIMIT;
          setUsageLimit(premiumLimit);
          localStorage.setItem('isPremiumUser', 'true');
          localStorage.setItem('proTierLimit', premiumLimit.toString());
        } else {
          console.log('[fetchUsage] User is on free tier');
        }
      } else {
        console.warn('[fetchUsage] API call was successful but returned success: false');
      }
    } catch (error) {
      console.error('[fetchUsage] Error fetching usage:', error);
      // Fall back to localStorage if API fails
      const storedCount = localStorage.getItem('insightSearchUsageCount');
      if (storedCount) {
        console.log('[fetchUsage] Using cached usage count from localStorage:', storedCount);
      } else {
        console.log('[fetchUsage] No cached usage data available, defaulting to 0');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const incrementUsage = useCallback(async () => {
    console.log('[incrementUsage] Starting usage increment, current count:', usageCount);
    
    // First check if user has already reached limit
    const currentLimit = isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT;
    if (usageCount >= currentLimit) {
      console.log('[incrementUsage] User has already reached usage limit');
      setShowUpgradeModal(true);
      return false;
    }
    
    // Immediately update local state for better UX and to prevent race conditions
    const optimisticCount = usageCount + 1;
    console.log('[incrementUsage] Setting optimistic local count:', optimisticCount);
    setUsageCount(optimisticCount);
    localStorage.setItem('insightSearchUsageCount', optimisticCount.toString());
    
    // Server update after local optimistic update
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[incrementUsage] Calling API to increment usage');
      const response = await fetch('/api/subscription/increment-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          featureId: INSIGHT_SEARCH_FEATURE 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to update usage: HTTP ${response.status}`;
        console.error('[incrementUsage] API error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('[incrementUsage] API response:', data);
      
      if (data.success) {
        // Update with server data - this is the authoritative count
        const serverCount = data.usage.count;
        console.log('[incrementUsage] Updating usage count from server:', serverCount);
        
        // Always update with the server count to ensure consistency
        setUsageCount(serverCount);
        localStorage.setItem('insightSearchUsageCount', serverCount.toString());
        
        // Check if user can use the feature (server may have determined they can't)
        if (!data.canUseFeature) {
          console.log('[incrementUsage] Server says user cannot use feature (limit reached)');
          setShowUpgradeModal(true);
          return false;
        }
        
        // Force update the child components via the DOM storage
        const eventDetail = { 
          count: serverCount,
          remainingSearches: Math.max(0, (isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT) - serverCount),
          isLimitReached: isPremium ? 
            serverCount >= PRO_TIER_INSIGHT_LIMIT : 
            serverCount >= FREE_TIER_LIMIT
        };
        console.log('[incrementUsage] Dispatching usage update event:', eventDetail);
        document.dispatchEvent(new CustomEvent('insightUsageUpdated', { detail: eventDetail }));
        
        // Return true to indicate success
        return true;
      }
      
      console.log('[incrementUsage] API call was not successful');
      return false;
    } catch (error) {
      console.error('[incrementUsage] Error:', error);
      setError(error.message);
      
      // We've already incremented locally above, so no need to do it again
      // Check if the new count exceeds the limit
      if (optimisticCount >= currentLimit) {
        console.log('[incrementUsage] Optimistic count exceeds limit, showing upgrade modal');
        setShowUpgradeModal(true);
        return false;
      }
      
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [usageCount, isPremium]);

  const handleUpgradeClick = useCallback(() => {
    router.push('/dashboard/account');
    setShowUpgradeModal(false);
  }, [router]);

  const handleCloseModal = useCallback(() => {
    setShowUpgradeModal(false);
  }, []);

  // Prepare the props to pass to children
  const childrenProps = {
    incrementUsage, 
    usageCount, 
    usageLimit: isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT, 
    isPremium,
    remainingSearches: Math.max(0, (isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT) - usageCount),
    isLimitReached: isPremium ? 
      usageCount >= PRO_TIER_INSIGHT_LIMIT : 
      usageCount >= FREE_TIER_LIMIT
  };

  return (
    <>
      <ChildrenRenderer render={children} props={childrenProps} />
      
      {/* Hidden element to store latest usage tracker values for direct access */}
      <div 
        id="usage-tracker-data" 
        data-values={JSON.stringify(childrenProps)} 
        style={{ display: 'none' }}
      />
      
      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              {isPremium ? 'Daily Usage Limit Reached' : 'Usage Limit Reached'}
            </DialogTitle>
            <DialogDescription>
              {isPremium 
                ? `You&apos;ve used all ${PRO_TIER_INSIGHT_LIMIT} Insight Searches available for today on your Pro plan.`
                : `You&apos;ve used all ${FREE_TIER_LIMIT} free Insight Searches available on the basic plan.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="bg-amber-50 p-4 rounded-md">
              {isPremium ? (
                <p className="text-sm text-amber-800">
                  Your daily limit will reset at midnight UTC. This limit helps ensure fair usage of our AI resources.
                </p>
              ) : (
                <p className="text-sm text-amber-800">
                  Upgrade to our Pro plan for {PRO_TIER_INSIGHT_LIMIT} daily Insight Searches and additional features.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Your usage:</p>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-gray-500 flex justify-between">
                <span>{usageCount} used</span>
                <span>{isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT} limit</span>
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              {isPremium ? 'I Understand' : 'Maybe Later'}
            </Button>
            
            {!isPremium && (
              <Button
                type="button"
                className="gap-2"
                onClick={handleUpgradeClick}
              >
                <CreditCard className="h-4 w-4" />
                Upgrade Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 