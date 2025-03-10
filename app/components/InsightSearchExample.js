'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InsightSearchUsageTracker from './InsightSearchUsageTracker';
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CreditCard } from "lucide-react";

export default function InsightSearchExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (incrementUsage) => {
    if (!searchQuery.trim()) return;
    
    // Check if user can perform the search
    const canSearch = await incrementUsage();
    
    if (!canSearch) {
      return; // The modal will be shown by the usage tracker
    }
    
    setIsSearching(true);
    
    try {
      // Simulate API call for search results
      // Replace this with your actual search API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock results
      setSearchResults([
        { id: 1, title: 'Result 1 for ' + searchQuery },
        { id: 2, title: 'Result 2 for ' + searchQuery },
        { id: 3, title: 'Result 3 for ' + searchQuery },
      ]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/dashboard/account');
  };

  return (
    <InsightSearchUsageTracker>
      {({ incrementUsage, usageCount, usageLimit, isPremium, remainingSearches, isLimitReached }) => (
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Insight Search</h1>
          
          <div className="mb-4">
            {isLimitReached ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Usage Limit Reached</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      You&apos;ve used all {usageLimit} of your free searches. Upgrade to Pro for unlimited searches.
                    </p>
                    <Button
                      onClick={handleUpgrade}
                      className="mt-3 bg-emerald-600 hover:bg-emerald-700"
                      size="sm"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 mb-2">
                {!isPremium ? (
                  <span>You have {remainingSearches} free searches remaining</span>
                ) : (
                  <span>You are on the Pro plan with unlimited searches</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter your search query"
              className="flex-1 border border-gray-300 rounded px-4 py-2"
              disabled={isLimitReached}
            />
            <Button
              onClick={() => handleSearch(incrementUsage)}
              disabled={isSearching || isLimitReached || !searchQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <h2 className="bg-gray-50 px-4 py-2 font-medium border-b">Results</h2>
              <ul className="divide-y">
                {searchResults.map(result => (
                  <li key={result.id} className="px-4 py-3 hover:bg-gray-50">
                    {result.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* For testing - normally you wouldn't show this */}
          <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
            <p>Debug Info: Search count: {usageCount}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                onClick={() => {
                  localStorage.removeItem('insightSearchUsageCount');
                  localStorage.removeItem('isPremiumUser');
                  window.location.reload();
                }}
                variant="outline"
                size="sm"
              >
                Reset Usage Count
              </Button>
              <Button 
                onClick={() => {
                  localStorage.setItem('isPremiumUser', 'true');
                  window.location.reload();
                }}
                variant="outline"
                size="sm"
              >
                Simulate Premium User
              </Button>
            </div>
          </div>
        </div>
      )}
    </InsightSearchUsageTracker>
  );
} 