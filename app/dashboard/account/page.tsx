'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import SubscriptionUpgradeButton from '@/app/components/SubscriptionUpgradeButton';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Free tier limit constant
const FREE_TIER_LIMIT = 20;

export default function AccountPage() {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [usageCount, setUsageCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load premium status and usage count from localStorage
    const storedPremiumStatus = localStorage.getItem('isPremiumUser') === 'true';
    const storedUsageCount = parseInt(localStorage.getItem('insightSearchUsageCount') || '0', 10);
    
    setIsPremium(storedPremiumStatus);
    setUsageCount(storedUsageCount);
    setIsLoading(false);
  }, []);

  // Calculate remaining searches and usage percentage
  const remainingSearches = Math.max(0, FREE_TIER_LIMIT - usageCount);
  const usagePercentage = Math.min((usageCount / FREE_TIER_LIMIT) * 100, 100);
  const isLimitReached = usageCount >= FREE_TIER_LIMIT && !isPremium;

  // Function to reset usage count (for testing purposes)
  const resetUsageCount = () => {
    localStorage.setItem('insightSearchUsageCount', '0');
    setUsageCount(0);
  };

  // Function to reset premium status (for testing purposes)
  const resetPremiumStatus = () => {
    localStorage.removeItem('isPremiumUser');
    setIsPremium(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">
          Manage your account settings and subscription
        </p>
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Plan</span>
                {isPremium ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">Pro</Badge>
                ) : (
                  <Badge>Basic</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isPremium 
                  ? "You're currently on the Pro plan with unlimited access to all features."
                  : `You're currently on the Basic plan with ${FREE_TIER_LIMIT} free Insight Searches.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-[20px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                  <CheckCircle2 className={`mr-2 h-5 w-5 ${isPremium ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <div className="space-y-1">
                    <p className="font-medium leading-none">Unlimited Insight Searches</p>
                    <p className="text-sm text-muted-foreground">
                      {isPremium 
                        ? "Access unlimited AI-powered insight searches" 
                        : `Limited to ${FREE_TIER_LIMIT} searches (Basic plan)`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-[20px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                  <CheckCircle2 className={`mr-2 h-5 w-5 ${isPremium ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <div className="space-y-1">
                    <p className="font-medium leading-none">Priority Support</p>
                    <p className="text-sm text-muted-foreground">
                      {isPremium 
                        ? "Get priority support from our team" 
                        : "Standard support (Basic plan)"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-[20px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                  <CheckCircle2 className={`mr-2 h-5 w-5 ${isPremium ? 'text-emerald-500' : 'text-gray-400'}`} />
                  <div className="space-y-1">
                    <p className="font-medium leading-none">Advanced Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      {isPremium 
                        ? "Access detailed analytics and insights" 
                        : "Basic analytics only (Basic plan)"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {isLoading ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : isPremium ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <div className="text-sm text-emerald-600 font-medium flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    You're subscribed to the Pro plan
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto" 
                    onClick={resetPremiumStatus}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Basic (Testing)
                  </Button>
                </div>
              ) : (
                <Elements stripe={stripePromise}>
                  <SubscriptionUpgradeButton />
                </Elements>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Track your feature usage across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Insight Searches</span>
                    <span className="text-sm text-muted-foreground">
                      {isPremium ? 'Unlimited' : `${usageCount}/${FREE_TIER_LIMIT} used`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    {isPremium ? (
                      <div className="h-full bg-emerald-500 w-full" />
                    ) : (
                      <div 
                        className={`h-full ${isLimitReached ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${usagePercentage}%` }} 
                      />
                    )}
                  </div>
                  {!isPremium && (
                    <div className="mt-2 flex items-start text-sm">
                      {isLimitReached ? (
                        <div className="flex items-center text-red-500">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span>You've reached your Basic plan limit</span>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          {remainingSearches} searches remaining
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {!isPremium && (
                <Elements stripe={stripePromise}>
                  <SubscriptionUpgradeButton />
                </Elements>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetUsageCount}
                className="ml-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Usage (Testing)
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 