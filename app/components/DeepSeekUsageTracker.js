'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { DEEP_SEEK_FEATURE, DEEP_SEEK_LIMIT } from '@/lib/subscription-client';

export default function DeepSeekUsageTracker({ children }) {
  const router = useRouter();
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(DEEP_SEEK_LIMIT);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNearLimit, setIsNearLimit] = useState(false);

  useEffect(() => {
    // Load initial usage from localStorage for immediate UI feedback
    const storedUsageCount = localStorage.getItem('deepSeekUsageCount');
    if (storedUsageCount) {
      setUsageCount(parseInt(storedUsageCount, 10));
      
      // Check if near limit (90% or more)
      const count = parseInt(storedUsageCount, 10);
      setIsNearLimit(count >= DEEP_SEEK_LIMIT * 0.9);
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
          featureId: DEEP_SEEK_FEATURE 
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
        localStorage.setItem('deepSeekUsageCount', data.usage.count.toString());
        
        // Check if near limit (90% or more)
        const count = data.usage.count || 0;
        setIsNearLimit(count >= DEEP_SEEK_LIMIT * 0.9);
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
    localStorage.setItem('deepSeekUsageCount', newCount.toString());
    
    // Check if user is approaching limit (90% or more)
    if (newCount >= DEEP_SEEK_LIMIT * 0.9 && newCount < DEEP_SEEK_LIMIT) {
      setIsNearLimit(true);
    }
    
    // Check if user has reached limit
    if (newCount >= DEEP_SEEK_LIMIT) {
      setShowWarningModal(true);
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
          featureId: DEEP_SEEK_FEATURE 
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
        localStorage.setItem('deepSeekUsageCount', data.usage.count.toString());
        
        // Check if user can use the feature
        if (!data.canUseFeature) {
          setShowWarningModal(true);
          return false;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      setError(error.message);
      // We keep the local increment even if the API fails
      return newCount < DEEP_SEEK_LIMIT;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowWarningModal(false);
  };

  return (
    <>
      {/* Pass the incrementUsage function to children */}
      {children({ 
        incrementUsage, 
        usageCount, 
        usageLimit: DEEP_SEEK_LIMIT, 
        remainingUses: Math.max(0, DEEP_SEEK_LIMIT - usageCount),
        isLimitReached: usageCount >= DEEP_SEEK_LIMIT,
        isNearLimit: isNearLimit
      })}
      
      {/* Warning Modal */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Daily Usage Limit Reached
            </DialogTitle>
            <DialogDescription>
              You&apos;ve used all {DEEP_SEEK_LIMIT} Deep Seek operations available for today.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="bg-amber-50 p-4 rounded-md">
              <p className="text-sm text-amber-800">
                The Deep Seek feature is limited to {DEEP_SEEK_LIMIT} uses per day to ensure fair usage of our AI resources.
                Your usage limit will reset at midnight UTC.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Your usage today:</p>
              <Progress value={100} className="h-2" />
              <p className="text-xs text-gray-500 flex justify-between">
                <span>{usageCount} used</span>
                <span>{DEEP_SEEK_LIMIT} limit</span>
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              onClick={handleCloseModal}
            >
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 