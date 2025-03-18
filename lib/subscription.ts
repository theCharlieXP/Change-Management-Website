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
  
  // Check if the dates are different (day has changed)
  return lastReset.getUTCDate() !== now.getUTCDate() || 
         lastReset.getUTCMonth() !== now.getUTCMonth() || 
         lastReset.getUTCFullYear() !== now.getUTCFullYear();
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
    .select('count, last_reset')
    .eq('user_id', userId)
    .eq('feature_id', featureId)
    .single();

  if (usageError && usageError.code !== 'PGRST116') {
    console.error('Error fetching usage:', usageError);
  }

  // Check if we need to reset the usage (new day)
  if (usage && shouldResetUsage(usage.last_reset)) {
    // Reset the usage count since it's a new day
    await supabase.rpc('reset_usage', {
      p_user_id: userId,
      p_feature_id: featureId
    });
    
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
    return {
      success: false,
      canUseFeature: false,
      usage: currentUsage
    };
  }
  
  // Get updated usage
  const updatedUsage = await getFeatureUsage(userId, featureId);
  
  // Verify that the count actually increased
  if (updatedUsage.count <= currentUsage.count) {
    console.warn(`[incrementFeatureUsage] Count did not increase after increment! Before: ${currentUsage.count}, After: ${updatedUsage.count}`);
    
    // Manually increment if the database operation didn't increase the count
    if (updatedUsage.count === currentUsage.count) {
      console.log(`[incrementFeatureUsage] Attempting direct update of usage_tracker table...`);
      
      // Direct update as a fallback
      const { error: updateError } = await supabase
        .from('usage_tracker')
        .update({ 
          count: updatedUsage.count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('feature_id', featureId);
        
      if (updateError) {
        console.error(`[incrementFeatureUsage] Direct update also failed:`, updateError);
      } else {
        console.log(`[incrementFeatureUsage] Direct update successful, fetching latest count`);
        // Fetch the usage again after direct update
        const finalUsage = await getFeatureUsage(userId, featureId);
        return {
          success: true,
          canUseFeature: !finalUsage.isLimitReached,
          usage: finalUsage
        };
      }
    }
  }
  
  console.log(`[incrementFeatureUsage] Usage successfully incremented. New count: ${updatedUsage.count}/${updatedUsage.limit}`);
  
  return {
    success: true,
    canUseFeature: !updatedUsage.isLimitReached,
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