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
  }, []);

  const fetchUsage = async () => {
    console.log('Fetching initial usage data');
    try {
      const response = await fetch('/api/subscription/get-usage', {
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
        const errorMessage = errorData.error || `HTTP error ${response.status}`;
        console.error('Failed to fetch usage data:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Usage data fetched:', data);
      
      if (data.success) {
        // Update local state with server data
        const serverCount = data.usage.count || 0;
        console.log('Setting usage count from server:', serverCount);
        setUsageCount(serverCount);
        
        // Update localStorage for UI consistency
        localStorage.setItem('insightSearchUsageCount', serverCount.toString());
        
        // If user has premium, update the limit
        if (data.usage.isPremium) {
          console.log('User is premium, updating limit');
          setIsPremium(true);
          const premiumLimit = data.usage.limit || PRO_TIER_INSIGHT_LIMIT;
          setUsageLimit(premiumLimit);
          localStorage.setItem('isPremiumUser', 'true');
          localStorage.setItem('proTierLimit', premiumLimit.toString());
        } else {
          console.log('User is on free tier');
        }
      } else {
        console.warn('API call was successful but returned success: false');
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
      // Fall back to localStorage if API fails
      const storedCount = localStorage.getItem('insightSearchUsageCount');
      if (storedCount) {
        console.log('Using cached usage count from localStorage:', storedCount);
      } else {
        console.log('No cached usage data available, defaulting to 0');
      }
    }
  };

  const incrementUsage = useCallback(async () => {
    console.log('Incrementing usage, current count:', usageCount);
    
    // First check if user has already reached limit
    const currentLimit = isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT;
    if (usageCount >= currentLimit) {
      console.log('User has already reached usage limit');
      setShowUpgradeModal(true);
      return false;
    }
    
    // Immediately update local state for better UX and to prevent race conditions
    const optimisticCount = usageCount + 1;
    console.log('Setting optimistic local count:', optimisticCount);
    setUsageCount(optimisticCount);
    localStorage.setItem('insightSearchUsageCount', optimisticCount.toString());
    
    // Server update after local optimistic update
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Calling API to increment usage');
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
        console.error('API error incrementing usage:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('API response for increment:', data);
      
      if (data.success) {
        // Update with server data - this is the authoritative count
        const serverCount = data.usage.count;
        console.log('Updating usage count from server response:', serverCount);
        
        // Always update with the server count to ensure consistency
        setUsageCount(serverCount);
        localStorage.setItem('insightSearchUsageCount', serverCount.toString());
        
        // Check if user can use the feature (server may have determined they can't)
        if (!data.canUseFeature) {
          console.log('Server says user cannot use feature (limit reached)');
          setShowUpgradeModal(true);
          return false;
        }
        
        // Force update the child components via the DOM storage
        document.dispatchEvent(new CustomEvent('insightUsageUpdated', { 
          detail: { 
            count: serverCount,
            remainingSearches: Math.max(0, (isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT) - serverCount),
            isLimitReached: isPremium ? 
              serverCount >= PRO_TIER_INSIGHT_LIMIT : 
              serverCount >= FREE_TIER_LIMIT
          } 
        }));
        
        // Return true to indicate success
        return true;
      }
      
      console.log('API call was not successful');
      return false;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      setError(error.message);
      
      // We've already incremented locally above, so no need to do it again
      // Check if the new count exceeds the limit
      if (optimisticCount >= currentLimit) {
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
                ? `You've used all ${PRO_TIER_INSIGHT_LIMIT} Insight Searches available for today on your Pro plan.`
                : `You've used all ${FREE_TIER_LIMIT} free Insight Searches available on the basic plan.`
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