import { auth } from '@clerk/nextjs/server';
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
 * Get the current user's subscription status
 */
export async function getUserSubscription(): Promise<SubscriptionStatus> {
  const authData = await auth();
  const userId = authData.userId;
  
  if (!userId) {
    return {
      isActive: false,
      plan: 'basic',
    };
  }

  const supabase = createClientComponentClient();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tier, stripe_customer_id, stripe_subscription_id, stripe_current_period_end, subscription_status')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    console.error('Error fetching subscription:', error);
    return {
      isActive: false,
      plan: 'basic',
    };
  }

  const isActive = 
    profile.subscription_status === 'active' && 
    (profile.stripe_current_period_end ? 
      new Date(profile.stripe_current_period_end) > new Date() : 
      true);

  return {
    isActive,
    plan: (profile.tier === 'pro' ? 'pro' : 'basic') as SubscriptionPlan,
    stripeCustomerId: profile.stripe_customer_id,
    stripeSubscriptionId: profile.stripe_subscription_id,
    stripeCurrentPeriodEnd: profile.stripe_current_period_end ? new Date(profile.stripe_current_period_end) : null,
  };
}

/**
 * Check if the current user is on the Pro plan
 */
export async function isProUser(): Promise<boolean> {
  const subscription = await getUserSubscription();
  return subscription.isActive && subscription.plan === 'pro';
}

/**
 * Check if usage should be reset (if last_reset is from a previous day)
 */
function shouldResetUsage(lastResetDate: string | null): boolean {
  if (!lastResetDate) return true;
  
  const lastReset = new Date(lastResetDate);
  const now = new Date();
  
  // Log the dates for debugging purposes
  console.log(`Checking if usage should reset - Last reset: ${lastResetDate}, Current time: ${now.toISOString()}`);
  console.log(`Last reset day: ${lastReset.getUTCDate()}, Current day: ${now.getUTCDate()}`);
  
  // Check if the dates are different (day has changed)
  // We specifically check UTC dates to ensure consistency across timezones
  const shouldReset = lastReset.getUTCDate() !== now.getUTCDate() || 
                     lastReset.getUTCMonth() !== now.getUTCMonth() || 
                     lastReset.getUTCFullYear() !== now.getUTCFullYear();
  
  if (shouldReset) {
    console.log('Usage should reset due to day change - resetting to 0');
  } else {
    console.log('Same day - usage should not reset');
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
    console.log('No userId provided, returning default usage limits');
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
  console.log(`Getting feature usage for user ${userId}, feature ${featureId}`);
  
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
  
  console.log(`User ${userId} is${isPro ? '' : ' not'} on the Pro plan`);
  
  // Determine the limit based on feature and plan
  let limit = FREE_TIER_LIMIT;
  
  if (featureId === INSIGHT_SEARCH_FEATURE) {
    limit = isPro ? PRO_TIER_INSIGHT_LIMIT : FREE_TIER_LIMIT;
  } else if (featureId === DEEP_SEEK_FEATURE) {
    limit = DEEP_SEEK_LIMIT; // Same limit for both plans
  }
  
  console.log(`Limit for ${featureId}: ${limit}`);
  
  // Get usage for the feature
  const { data: usage, error: usageError } = await supabase
    .from('usage_tracker')
    .select('count, last_reset')
    .eq('user_id', userId)
    .eq('feature_id', featureId)
    .single();

  if (usageError && usageError.code !== 'PGRST116') {
    console.error('Error fetching usage:', usageError);
  }

  console.log(`Current usage data:`, usage);

  // Check if we need to reset the usage (new day)
  if (usage && shouldResetUsage(usage.last_reset)) {
    console.log(`Resetting usage for user ${userId}, feature ${featureId} - new day detected`);
    // Reset the usage count since it's a new day
    const { error: resetError } = await supabase.rpc('reset_usage', {
      p_user_id: userId,
      p_feature_id: featureId
    });
    
    if (resetError) {
      console.error('Error resetting usage:', resetError);
    } else {
      console.log(`Successfully reset usage to 0`);
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

  console.log(`Final usage calculation: count=${count}, limit=${limit}, remaining=${remaining}, isLimitReached=${isLimitReached}`);

  // If this is the first time we're checking usage for this feature, create a record
  if (!usage) {
    console.log(`No usage record found, creating initial record for user ${userId}, feature ${featureId}`);
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
      console.error('Error creating initial usage record:', createError);
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
 * Increment usage for a specific feature
 * Returns true if the operation was successful and the user can use the feature
 * Returns false if the user has reached their limit
 */
export async function incrementFeatureUsage(featureId: string): Promise<{
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
  const authData = await auth();
  const userId = authData.userId;
  
  if (!userId) {
    console.warn('incrementFeatureUsage called without a valid userId');
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

  // Get current usage
  const currentUsage = await getFeatureUsage(userId, featureId);
  console.log(`[incrementFeatureUsage] Current usage before increment: ${currentUsage.count}/${currentUsage.limit}`);
  
  // Check if user has reached their limit
  if (currentUsage.isLimitReached) {
    console.log(`[incrementFeatureUsage] User ${userId} has reached usage limit (${currentUsage.count}/${currentUsage.limit})`);
    return {
      success: false,
      canUseFeature: false,
      usage: currentUsage
    };
  }

  // Increment usage
  const supabase = createClientComponentClient();
  
  console.log(`[incrementFeatureUsage] Calling increment_usage RPC for user ${userId} and feature ${featureId}`);
  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_feature_id: featureId
  });
  
  if (error) {
    console.error(`[incrementFeatureUsage] Error calling increment_usage RPC:`, error);
    
    // Fallback: Try direct update if RPC fails
    console.log(`[incrementFeatureUsage] Attempting direct update of usage_tracker table...`);
    
    const { error: updateError } = await supabase
      .from('usage_tracker')
      .update({ count: currentUsage.count + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('feature_id', featureId);
    
    if (updateError) {
      console.error(`[incrementFeatureUsage] Error with direct update:`, updateError);
      
      // Final fallback: Try insertion of new record if update fails
      console.log(`[incrementFeatureUsage] Attempting insertion of new usage record...`);
      
      const { error: insertError } = await supabase
        .from('usage_tracker')
        .insert([
          { 
            user_id: userId, 
            feature_id: featureId, 
            count: 1,
            last_reset: new Date().toISOString()
          }
        ]);
      
      if (insertError) {
        console.error(`[incrementFeatureUsage] Error with insertion:`, insertError);
        
        // If all database operations fail, at least update localStorage
        if (typeof window !== 'undefined') {
          const newCount = currentUsage.count + 1;
          localStorage.setItem('insightSearchUsageCount', newCount.toString());
          console.log(`[incrementFeatureUsage] Updated localStorage to count ${newCount}`);
          
          // Return optimistic result
          const newRemaining = Math.max(0, currentUsage.limit - newCount);
          const newIsLimitReached = newCount >= currentUsage.limit;
          
          return {
            success: true, // Optimistically assume success
            canUseFeature: !newIsLimitReached,
            usage: {
              count: newCount,
              limit: currentUsage.limit,
              remaining: newRemaining,
              isLimitReached: newIsLimitReached,
              isPremium: currentUsage.isPremium
            }
          };
        }
        
        // Last resort: Return original usage but allow operation
        return {
          success: true, // Allow operation despite errors
          canUseFeature: true,
          usage: currentUsage
        };
      }
    }
  }
  
  // Get updated usage after increment
  const updatedUsage = await getFeatureUsage(userId, featureId);
  console.log(`[incrementFeatureUsage] Updated usage after increment: ${updatedUsage.count}/${updatedUsage.limit}`);
  
  // Verify that count actually increased
  if (updatedUsage.count <= currentUsage.count) {
    console.warn(`[incrementFeatureUsage] Warning: Count did not increase after increment operation. Force updating the count.`);
    // Force an optimistic result with incremented count
    updatedUsage.count = currentUsage.count + 1;
    updatedUsage.remaining = Math.max(0, updatedUsage.limit - updatedUsage.count);
    updatedUsage.isLimitReached = updatedUsage.count >= updatedUsage.limit;
    
    // Force update localStorage with the incremented count
    if (typeof window !== 'undefined') {
      localStorage.setItem('insightSearchUsageCount', updatedUsage.count.toString());
    }
  }
  
  // Update localStorage regardless to ensure consistency
  if (typeof window !== 'undefined') {
    localStorage.setItem('insightSearchUsageCount', updatedUsage.count.toString());
  }
  
  // Check if user has reached their limit after increment
  const canUseFeature = !updatedUsage.isLimitReached;
  
  return {
    success: true,
    canUseFeature,
    usage: updatedUsage
  };
}

/**
 * Reset usage for a specific feature
 */
export async function resetFeatureUsage(userId: string, featureId: string): Promise<void> {
  if (!userId) {
    return;
  }

  const supabase = createClientComponentClient();
  
  const { error } = await supabase.rpc('reset_usage', {
    p_user_id: userId,
    p_feature_id: featureId
  });
  
  if (error) {
    console.error('Error resetting usage:', error);
  }
}

/**
 * Update a user's subscription information
 */
export async function updateUserSubscription(
  userId: string,
  data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    stripeCurrentPeriodEnd?: Date;
    status: string;
    plan: SubscriptionPlan;
  }
): Promise<void> {
  if (!userId) {
    return;
  }

  const supabase = createClientComponentClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: data.stripeCustomerId,
      stripe_subscription_id: data.stripeSubscriptionId,
      stripe_price_id: data.stripePriceId,
      stripe_current_period_end: data.stripeCurrentPeriodEnd,
      subscription_status: data.status,
      tier: data.plan
    })
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
} 