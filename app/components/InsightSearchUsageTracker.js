'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CreditCard, AlertCircle } from 'lucide-react';
import { INSIGHT_SEARCH_FEATURE } from '@/lib/subscription-client';

const FREE_TIER_LIMIT = 20;

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
      setUsageLimit(Infinity);
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
          setUsageLimit(Infinity);
          localStorage.setItem('isPremiumUser', 'true');
        }
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
      // Fall back to localStorage if API fails
    }
  };

  const incrementUsage = async () => {
    // First update local state for immediate feedback
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem('insightSearchUsageCount', newCount.toString());
    
    // Check if user has reached limit
    if (!isPremium && newCount >= FREE_TIER_LIMIT) {
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
      return isPremium || newCount < FREE_TIER_LIMIT;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    router.push('/dashboard/account');
    setShowUpgradeModal(false);
  };

  const handleCloseModal = () => {
    setShowUpgradeModal(false);
  };

  return (
    <>
      {/* Pass the incrementUsage function to children */}
      {children({ 
        incrementUsage, 
        usageCount, 
        usageLimit: FREE_TIER_LIMIT, 
        isPremium,
        remainingSearches: Math.max(0, FREE_TIER_LIMIT - usageCount),
        isLimitReached: !isPremium && usageCount >= FREE_TIER_LIMIT
      })}
      
      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Usage Limit Reached
            </DialogTitle>
            <DialogDescription>
              You&apos;ve used all {FREE_TIER_LIMIT} free Insight Searches available on the basic plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="bg-amber-50 p-4 rounded-md">
              <p className="text-sm text-amber-800">
                Upgrade to our Pro plan for unlimited Insight Searches and additional features.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Your usage:</p>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-gray-500 flex justify-between">
                <span>{usageCount} used</span>
                <span>{FREE_TIER_LIMIT} limit</span>
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              Maybe Later
            </Button>
            
            <Button
              type="button"
              className="gap-2"
              onClick={handleUpgradeClick}
            >
              <CreditCard className="h-4 w-4" />
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 