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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Plan Card */}
            <Card className="border-2 border-gray-200 h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Basic Plan</span>
                  {!isPremium && (
                    <Badge variant="outline" className="ml-2 px-3 py-1 text-sm font-medium">Current Plan</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Free tier with limited features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <span className="text-3xl font-bold">Free</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">Limited Insight Searches</p>
                      <p className="text-sm text-muted-foreground">
                        Only {FREE_TIER_LIMIT} searches available
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                {!isPremium ? (
                  <Button 
                    variant="outline" 
                    className="w-full opacity-0 cursor-default"
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={resetPremiumStatus}
                  >
                    Downgrade to Basic
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Pro Plan Card */}
            <Card className={`border-2 ${isPremium ? 'border-emerald-500' : 'border-gray-200'} h-full shadow-lg relative overflow-hidden`}>
              {isPremium && (
                <div className="absolute top-0 right-0">
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-none rounded-bl-lg px-4 py-1.5 text-sm font-medium">Current Plan</Badge>
                </div>
              )}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pro Plan</span>
                  {isPremium && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  Unlimited access to all features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <span className="text-3xl font-bold">£3</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Unlimited Insight Searches</p>
                      <p className="text-sm text-muted-foreground">
                        No restrictions on usage
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                {isLoading ? (
                  <Button disabled className="w-full">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </Button>
                ) : isPremium ? (
                  <div className="text-sm text-emerald-600 font-medium flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Pro plan active
                  </div>
                ) : (
                  <Elements stripe={stripePromise}>
                    <SubscriptionUpgradeButton />
                  </Elements>
                )}
              </CardFooter>
            </Card>
          </div>
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