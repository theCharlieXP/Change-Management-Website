import { auth } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Constants
export const FREE_TIER_LIMIT = 20;
export const INSIGHT_SEARCH_FEATURE = 'insight_search';

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
  const { userId } = auth();
  
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
  
  if (isPro) {
    return {
      count: 0,
      limit: Infinity,
      remaining: Infinity,
      isLimitReached: false,
      canUseFeature: true,
      isPremium: true
    };
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
  const remaining = Math.max(0, FREE_TIER_LIMIT - count);
  const isLimitReached = count >= FREE_TIER_LIMIT;

  return {
    count,
    limit: FREE_TIER_LIMIT,
    remaining,
    isLimitReached,
    canUseFeature: !isLimitReached,
    isPremium: false
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
  const { userId } = auth();
  
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

  // Get current usage
  const currentUsage = await getFeatureUsage(userId, featureId);
  
  // Check if user is premium or has reached their limit
  if (currentUsage.isPremium) {
    // Pro users always have access, but we still track usage
    const supabase = createClientComponentClient();
    
    const { error } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_feature_id: featureId
    });
    
    if (error) {
      console.error('Error incrementing usage:', error);
      return {
        success: false,
        canUseFeature: true, // Still allow pro users even if tracking fails
        usage: currentUsage
      };
    }
    
    return {
      success: true,
      canUseFeature: true,
      usage: {
        ...currentUsage,
        count: currentUsage.count + 1
      }
    };
  }
  
  // Check if user has reached their limit
  if (currentUsage.isLimitReached) {
    return {
      success: false,
      canUseFeature: false,
      usage: currentUsage
    };
  }

  // Increment usage
  const supabase = createClientComponentClient();
  
  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_feature_id: featureId
  });
  
  if (error) {
    console.error('Error incrementing usage:', error);
    return {
      success: false,
      canUseFeature: false,
      usage: currentUsage
    };
  }
  
  // Get updated usage
  const updatedUsage = await getFeatureUsage(userId, featureId);
  
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
  if (!userId) return;
  
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
 * Update or create a user subscription
 * This function is kept for backward compatibility but now uses Supabase
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
  const supabase = createClientComponentClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: data.stripeCustomerId,
      stripe_subscription_id: data.stripeSubscriptionId,
      stripe_price_id: data.stripePriceId,
      stripe_current_period_end: data.stripeCurrentPeriodEnd?.toISOString(),
      subscription_status: data.status,
      tier: data.plan,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
} 