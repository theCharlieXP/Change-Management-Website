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
 * Check if usage should be reset (if last_reset is from a previous day)
 */
function shouldResetUsage(lastResetDate: string | null): boolean {
  if (!lastResetDate) return true;
  
  const lastReset = new Date(lastResetDate);
  const now = new Date();
  
  // Log the dates for debugging purposes
  console.log(`[shouldResetUsage] Checking if usage should reset - Last reset: ${lastResetDate}, Current time: ${now.toISOString()}`);
  console.log(`[shouldResetUsage] Last reset day: ${lastReset.getUTCDate()}, Current day: ${now.getUTCDate()}`);
  
  // Check if the dates are different (day has changed)
  // We specifically check UTC dates to ensure consistency across timezones
  const shouldReset = lastReset.getUTCDate() !== now.getUTCDate() || 
                     lastReset.getUTCMonth() !== now.getUTCMonth() || 
                     lastReset.getUTCFullYear() !== now.getUTCFullYear();
  
  if (shouldReset) {
    console.log('[shouldResetUsage] Usage should reset due to day change - resetting to 0');
  } else {
    console.log('[shouldResetUsage] Same day - usage should not reset');
  }
  
  return shouldReset;
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
    console.log('[getFeatureUsage] No userId provided, returning default usage limits');
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
  console.log(`[getFeatureUsage] Getting feature usage for user ${userId}, feature ${featureId}`);
  
  // Check if user is on Pro plan
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, subscription_status, stripe_current_period_end')
    .eq('user_id', userId)
    .single();
  
  if (profileError) {
    console.error('[getFeatureUsage] Error fetching profile:', profileError);
  }
  
  const isPro = profile?.tier === 'pro' && 
                profile?.subscription_status === 'active' && 
                (profile?.stripe_current_period_end ? 
                  new Date(profile.stripe_current_period_end) > new Date() : 
                  true);
  
  console.log(`[getFeatureUsage] User ${userId} is${isPro ? '' : ' not'} on the Pro plan`);
  
  // Determine the limit based on feature and plan
  let limit = FREE_TIER_LIMIT;
  
  if (featureId === INSIGHT_SEARCH_FEATURE) {
    limit = isPro ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT;
  } else if (featureId === DEEP_SEEK_FEATURE) {
    limit = DEEP_SEEK_LIMIT; // Same limit for both plans
  }
  
  console.log(`[getFeatureUsage] Limit for ${featureId}: ${limit}`);
  
  // Get usage for the feature
  const { data: usage, error: usageError } = await supabase
    .from('usage_tracker')
    .select('count, last_reset')
    .eq('user_id', userId)
    .eq('feature_id', featureId)
    .single();

  if (usageError && usageError.code !== 'PGRST116') {
    console.error('[getFeatureUsage] Error fetching usage:', usageError);
  }

  console.log(`[getFeatureUsage] Current usage data:`, usage);

  // Check if we need to reset the usage (new day)
  if (usage && shouldResetUsage(usage.last_reset)) {
    console.log(`[getFeatureUsage] Resetting usage for user ${userId}, feature ${featureId} - new day detected`);
    // Reset the usage count since it's a new day
    const { error: resetError } = await supabase.rpc('reset_usage', {
      p_user_id: userId,
      p_feature_id: featureId
    });
    
    if (resetError) {
      console.error('[getFeatureUsage] Error resetting usage:', resetError);
    } else {
      console.log(`[getFeatureUsage] Successfully reset usage to 0`);
    }
    
    // After resetting, we know the count is 0
    return {
      count: 0,
      limit,
      remaining: limit,
      isLimitReached: false,
      canUseFeature: true,
      isPremium: isPro
    };
  }

  const count = usage?.count || 0;
  const remaining = Math.max(0, limit - count);
  const isLimitReached = count >= limit;

  console.log(`[getFeatureUsage] Final usage calculation: count=${count}, limit=${limit}, remaining=${remaining}, isLimitReached=${isLimitReached}`);

  // If this is the first time we're checking usage for this feature, create a record
  if (!usage) {
    console.log(`[getFeatureUsage] No usage record found, creating initial record for user ${userId}, feature ${featureId}`);
    // Create an initial usage record with count 0
    const { error: createError } = await supabase
      .from('usage_tracker')
      .insert([
        { 
          user_id: userId, 
          feature_id: featureId, 
          count: 0,
          last_reset: new Date().toISOString()
        }
      ]);
      
    if (createError) {
      console.error('[getFeatureUsage] Error creating initial usage record:', createError);
    }
  }

  // Store in localStorage for faster access
  if (typeof window !== 'undefined') {
    localStorage.setItem('insightSearchUsageCount', count.toString());
    localStorage.setItem('isPremiumUser', isPro.toString());
  }

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
    console.log('[checkAndIncrementFeatureUsage] No userId provided');
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
    console.log(`[checkAndIncrementFeatureUsage] Calling API to increment usage for user ${userId}`);
    // Call the API endpoint to increment usage
    const response = await fetch('/api/subscription/increment-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ featureId }),
    });

    if (!response.ok) {
      console.error(`[checkAndIncrementFeatureUsage] API error: ${response.status}`);
      throw new Error('Failed to increment usage');
    }

    const data = await response.json();
    console.log(`[checkAndIncrementFeatureUsage] API response:`, data);
    return data;
  } catch (error) {
    console.error('[checkAndIncrementFeatureUsage] Error:', error);
    
    // Fallback to just getting the current usage
    console.log('[checkAndIncrementFeatureUsage] Falling back to getting current usage');
    const currentUsage = await getFeatureUsage(userId, featureId);
    
    return {
      success: false,
      canUseFeature: !currentUsage.isLimitReached || currentUsage.isPremium,
      usage: currentUsage
    };
  }
} 