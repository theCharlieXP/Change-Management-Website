import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Constants
export const FREE_TIER_LIMIT = 20;
export const PRO_TIER_INSIGHT_LIMIT = 100; // Daily limit for pro users
export const INSIGHT_SEARCH_FEATURE = 'insight_search';
export const DEEP_SEEK_FEATURE = 'deep_seek';
export const DEEP_SEEK_LIMIT = 100; // Daily limit for both basic and pro users

// Types
export type SubscriptionPlan = 'basic' | 'pro';

export interface SubscriptionStatus {
  isActive: boolean;
  plan: SubscriptionPlan;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
}

export interface UsageInfo {
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
}

/**
 * Get usage information for a specific feature
 */
export async function getFeatureUsage(userId: string, featureId: string): Promise<{
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  canUseFeature: boolean;
  isPremium: boolean;
}> {
  if (!userId) {
    return {
      count: 0,
      limit: FREE_TIER_LIMIT,
      remaining: FREE_TIER_LIMIT,
      isLimitReached: false,
      canUseFeature: true,
      isPremium: false
    };
  }

  const supabase = createClientComponentClient();
  
  // Check if user is on Pro plan
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, subscription_status, stripe_current_period_end')
    .eq('user_id', userId)
    .single();
  
  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }
  
  const isPro = profile?.tier === 'pro' && 
                profile?.subscription_status === 'active' && 
                (profile?.stripe_current_period_end ? 
                  new Date(profile.stripe_current_period_end) > new Date() : 
                  true);
  
  // Determine the limit based on feature and plan
  let limit = FREE_TIER_LIMIT;
  
  if (featureId === INSIGHT_SEARCH_FEATURE) {
    limit = isPro ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT;
  } else if (featureId === DEEP_SEEK_FEATURE) {
    limit = DEEP_SEEK_LIMIT; // Same limit for both plans
  }
  
  // Get usage for the feature
  const { data: usage, error: usageError } = await supabase
    .from('usage_tracker')
    .select('count')
    .eq('user_id', userId)
    .eq('feature_id', featureId)
    .single();

  if (usageError && usageError.code !== 'PGRST116') {
    console.error('Error fetching usage:', usageError);
  }

  const count = usage?.count || 0;
  const remaining = Math.max(0, limit - count);
  const isLimitReached = count >= limit;

  return {
    count,
    limit,
    remaining,
    isLimitReached,
    canUseFeature: !isLimitReached,
    isPremium: isPro
  };
}

/**
 * Client-side function to check feature usage and increment if allowed
 */
export async function checkAndIncrementFeatureUsage(userId: string, featureId: string): Promise<{
  success: boolean;
  canUseFeature: boolean;
  usage: {
    count: number;
    limit: number;
    remaining: number;
    isLimitReached: boolean;
    isPremium: boolean;
  }
}> {
  if (!userId) {
    return {
      success: false,
      canUseFeature: false,
      usage: {
        count: 0,
        limit: FREE_TIER_LIMIT,
        remaining: FREE_TIER_LIMIT,
        isLimitReached: false,
        isPremium: false
      }
    };
  }

  try {
    // Call the API endpoint to increment usage
    const response = await fetch('/api/subscription/increment-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ featureId }),
    });

    if (!response.ok) {
      throw new Error('Failed to increment usage');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    
    // Fallback to just getting the current usage
    const currentUsage = await getFeatureUsage(userId, featureId);
    
    return {
      success: false,
      canUseFeature: !currentUsage.isLimitReached || currentUsage.isPremium,
      usage: currentUsage
    };
  }
} 