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
      setUsageLimit(PRO_TIER_INSIGHT_LIMIT);
    }
    
    // Fetch actual usage from server
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
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
        throw new Error('Failed to fetch usage data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state with server data
        setUsageCount(data.usage.count || 0);
        
        // Update localStorage for UI consistency
        localStorage.setItem('insightSearchUsageCount', data.usage.count.toString());
        
        // If user has premium, update the limit
        if (data.usage.isPremium) {
          setIsPremium(true);
          setUsageLimit(PRO_TIER_INSIGHT_LIMIT);
          localStorage.setItem('isPremiumUser', 'true');
        }
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
      // Fall back to localStorage if API fails
    }
  };

  const incrementUsage = useCallback(async () => {
    // First update local state for immediate feedback
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem('insightSearchUsageCount', newCount.toString());
    
    // Check if user has reached limit
    const currentLimit = isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT;
    if (newCount >= currentLimit) {
      setShowUpgradeModal(true);
      return false;
    }
    
    // Then update server
    try {
      setIsLoading(true);
      setError(null);
      
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update usage');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update with server data
        setUsageCount(data.usage.count);
        localStorage.setItem('insightSearchUsageCount', data.usage.count.toString());
        
        // Check if user can use the feature
        if (!data.canUseFeature) {
          setShowUpgradeModal(true);
          return false;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      setError(error.message);
      // We keep the local increment even if the API fails
      const currentLimit = isPremium ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT;
      return newCount < currentLimit;
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