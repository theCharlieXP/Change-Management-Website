"use client"

import { useState, useEffect } from "react"
import { Loader2, CalendarIcon, ChevronDown, ChevronUp, ExternalLink, BookmarkPlus, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link } from "@/components/ui/link"
import { MultiSelect } from "@/components/ui/multi-select"
import { InsightModal } from '@/components/insight-modal'
import { InsightCard } from '@/components/insight-card'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { INSIGHT_FOCUS_AREAS } from '@/types/insights'
import type { Insight, InsightFocusArea } from '@/types/insights'
import { Project, ProjectStatus } from '@/types/projects'
import { fetchWithAuth } from '@/lib/fetch-utils'
import { toast } from "@/components/ui/use-toast"
import { createClient } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@clerk/nextjs'
import { Textarea } from "@/components/ui/textarea"
import { SaveToProjectDialog } from '@/components/save-to-project-dialog'
import InsightSearchUsageTracker from '@/app/components/InsightSearchUsageTracker'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type TimeframeValue = 
  | 'last_day'
  | 'last_week'
  | 'last_month'
  | 'last_year'

const INDUSTRIES = [
  'Healthcare',
  'Finance & Banking',
  'Manufacturing',
  'Technology & IT',
  'Education',
  'Retail & E-commerce',
  'Energy & Utilities',
  'Telecommunications',
  'Government & Public Sector',
  'Transportation & Logistics',
  'Hospitality & Tourism',
  'Non-Profit & NGOs',
  'Real Estate',
  'Automotive',
  'Pharmaceuticals',
  'Media & Entertainment',
  'Agriculture',
  'Construction',
  'Legal Services',
  'Consumer Goods'
]

interface InsightData {
  id: string
  title: string
  summary: string
  content: string[]
  category: string
  tags: string[]
  readTime: string
  focus_area: InsightFocusArea
  source: string
  url: string
  created_at: string
  updated_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function InsightsPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [query, setQuery] = useState("")
  const [focusArea, setFocusArea] = useState<InsightFocusArea | undefined>(undefined)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)
  const [insightNotes, setInsightNotes] = useState<Record<string, string>>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryNotes, setSummaryNotes] = useState<string>("")
  const [isSummarizing, setIsSummarizing] = useState(false)
  const { toast } = useToast()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [insightToSave, setInsightToSave] = useState<Insight | null>(null)
  const [incrementUsageFunc, setIncrementUsageFunc] = useState<(() => Promise<boolean>) | null>(null)
  const [remainingSearchesCount, setRemainingSearchesCount] = useState<number>(0)
  const [isSearchLimitReached, setIsSearchLimitReached] = useState<boolean>(false)
  
  // New state variables to store tracker values
  const [trackerValues, setTrackerValues] = useState<{
    incrementUsage: (() => Promise<boolean>) | null;
    remainingSearches: number;
    isLimitReached: boolean;
  }>({
    incrementUsage: null,
    remainingSearches: 0,
    isLimitReached: false
  });

  // Effect to update component state when tracker values change
  useEffect(() => {
    if (trackerValues.incrementUsage) {
      setIncrementUsageFunc(() => trackerValues.incrementUsage);
    }
    setRemainingSearchesCount(trackerValues.remainingSearches);
    setIsSearchLimitReached(trackerValues.isLimitReached);
    
    // Log the current usage state for debugging
    console.log('Usage tracker updated:', {
      remainingSearches: trackerValues.remainingSearches,
      isLimitReached: trackerValues.isLimitReached
    });
  }, [trackerValues]);

  // Add a more reliable event listener to update from DOM events triggered by the tracker
  useEffect(() => {
    const handleUsageUpdate = (event: CustomEvent) => {
      console.log('Received usage update event:', event.detail);
      
      if (event.detail) {
        // Update local state with the new values
        setRemainingSearchesCount(event.detail.remainingSearches);
        setIsSearchLimitReached(event.detail.isLimitReached);
        
        // Also update the tracker values for consistency
        setTrackerValues(prevValues => ({
          ...prevValues,
          remainingSearches: event.detail.remainingSearches,
          isLimitReached: event.detail.isLimitReached
        }));
        
        // Force the UI to refresh with the latest count
        console.log('Updated remaining searches to:', event.detail.remainingSearches);
      }
    };
    
    // Add event listener
    document.addEventListener('insightUsageUpdated', handleUsageUpdate as EventListener);
    
    // Clean up event listener
    return () => {
      document.removeEventListener('insightUsageUpdated', handleUsageUpdate as EventListener);
    };
  }, []);

  // Add a special effect to check for usage tracker data on page load/navigation
  useEffect(() => {
    // This runs when component mounts or after navigation
    const checkTrackerData = () => {
      const trackerElement = document.getElementById('usage-tracker-data');
      if (trackerElement && trackerElement.dataset.values) {
        try {
          const trackerData = JSON.parse(trackerElement.dataset.values);
          console.log('Found tracker data in DOM:', trackerData);
          
          // Update our local state to match the tracker data
          if (trackerData.remainingSearches !== undefined) {
            setRemainingSearchesCount(trackerData.remainingSearches);
          }
          
          if (trackerData.isLimitReached !== undefined) {
            setIsSearchLimitReached(trackerData.isLimitReached);
          }
          
          // Update the tracker values for consistency
          setTrackerValues(prevValues => ({
            ...prevValues,
            incrementUsage: prevValues.incrementUsage, // Keep the existing function
            remainingSearches: trackerData.remainingSearches || prevValues.remainingSearches,
            isLimitReached: trackerData.isLimitReached || prevValues.isLimitReached
          }));
          
          console.log('Updated state from DOM tracker data');
        } catch (error) {
          console.error('Error parsing tracker data:', error);
        }
      }
    };
    
    // Check immediately on mount
    checkTrackerData();
    
    // Also check after a short delay to ensure the tracker component has initialized
    const delayedCheck = setTimeout(checkTrackerData, 500);
    
    return () => {
      clearTimeout(delayedCheck);
    };
  }, []);

  // Fetch projects when auth is ready
  useEffect(() => {
    let isMounted = true
    
    const fetchProjects = async () => {
      // Skip if auth isn&apos;t ready
      if (!isLoaded) {
        console.log('Auth not loaded yet, waiting...')
        return
      }

      // Skip if not signed in
      if (!isSignedIn) {
        console.log('User not signed in, skipping project fetch')
        setProjectsLoading(false)
        return
      }

      try {
        console.log('Auth ready, fetching projects...')
        setProjectsLoading(true)

        const response = await fetch('/api/projects')
        
        // Handle response
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Project fetch failed:', { 
            status: response.status, 
            statusText: response.statusText,
            errorData 
          })
          throw new Error(errorData.details || 'Failed to fetch projects')
        }

        const data = await response.json()
        console.log('Successfully fetched projects:', data)
        
        if (isMounted) {
          setProjects(data)
          setProjectsLoading(false)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        if (isMounted) {
          setProjectsLoading(false)
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load projects. Please try refreshing the page.",
            variant: "destructive"
          })
        }
      }
    }

    fetchProjects()

    return () => {
      isMounted = false
    }
  }, [isLoaded, isSignedIn, toast])

  const resetFilters = () => {
    // Reset all state values
    setFocusArea(undefined)
    setSelectedIndustries([])
    
    // Force a re-render of all components
    setResetKey(prev => prev + 1)
  }

  const fetchInsights = async () => {
    if (!focusArea) {
      setError('Please select an Insight Focus Area')
      return
    }

    setError(null)
    
    // Check if user can perform the search
    if (!incrementUsageFunc) {
      console.error('Search functionality not available: incrementUsageFunc is null');
      setError('Search functionality not available')
      return
    }
    
    try {
      // Store the previous state for debugging
      const previousRemaining = remainingSearchesCount;
      
      // Important: This incrementUsageFunc call updates the usage counter
      // We need to wait for its result before proceeding
      console.log('Calling incrementUsage function...');
      const canSearch = await incrementUsageFunc();
      
      // Log the result of the incrementUsage call for debugging
      console.log('Increment usage result:', canSearch);
      console.log('Previous remaining searches:', previousRemaining, 'New remaining:', remainingSearchesCount);
      
      if (!canSearch) {
        console.log('Search limit reached or increment failed');
        return // The modal will be shown by the usage tracker
      }
      
      // Check if we're at the limit after incrementing
      if (remainingSearchesCount <= 0 || isSearchLimitReached) {
        console.log('No remaining searches after increment, stopping search');
        return;
      }
      
      // Double check usage tracker data from the DOM element
      const trackerElement = document.getElementById('usage-tracker-data');
      if (trackerElement) {
        const trackerData = JSON.parse(trackerElement.dataset.values || '{}');
        if (trackerData.remainingSearches !== undefined) {
          if (trackerData.remainingSearches <= 0 || trackerData.isLimitReached) {
            console.log('Usage tracker data indicates no remaining searches, stopping search');
            return;
          }
          // Update our local state to match the tracker data
          setRemainingSearchesCount(trackerData.remainingSearches);
          setIsSearchLimitReached(trackerData.isLimitReached);
        }
      }
      
      setLoading(true)
      setSummary(null)
      
      // Step 1: Initial search
      setLoadingStage("Initialising search...")
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (focusArea) params.append('focusArea', focusArea)
      if (selectedIndustries.length > 0) params.append('industries', selectedIndustries.join(','))

      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 2: Search and analysis
      setLoadingStage("Searching through trusted sources...")
      
      // Create an AbortController to handle client-side timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased from 35000 to 60000 ms
      
      try {
        const response = await fetch(`/api/insights/search?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          signal: controller.signal
        }).finally(() => {
          clearTimeout(timeoutId);
        });

        console.log('Search response status:', response.status);

        // Handle specific HTTP status codes
        if (response.status === 504) {
          throw new Error('The search request timed out. Please try a more specific query, fewer industries, or a different focus area.');
        }

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } catch (e) {
            // If we can't parse the JSON, just use the default error message
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if ('error' in data) {
          console.error('Search error in response data:', data);
          throw new Error(data.error);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingStage("Analysing findings and identifying patterns...");

        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingStage("Synthesising insights and creating summary...");

        // Extract results and summary from the response
        const { results, summary } = data;
        
        // Update state with results and summary
        setInsights(results || []);
        setSummary(summary || null);

        // Show success message if we got results
        if (results.length > 0) {
          toast({
            title: "Search Complete",
            description: `Found ${results.length} relevant sources`,
          });
        } else {
          toast({
            title: "No Results",
            description: "Try adjusting your search criteria or selecting different filters",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Search error:', error);
        
        // Provide more specific error messages based on the error
        if (error.name === 'AbortError') {
          setError('The search request was cancelled. Please try again with a more specific query.');
        } else if (error.message.includes('timed out')) {
          setError('The search request timed out. Please try a more specific query, fewer industries, or a different focus area.');
        } else {
          setError(error.message || 'An error occurred while searching. Please try again.');
        }
        
        toast({
          title: "Search Error",
          description: error.message || "An error occurred while searching",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setLoadingStage(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }

  // Add keyboard support for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && focusArea) {
      fetchInsights()
    }
  }

  // Replace toggleCard with openModal
  const openModal = (id: string) => {
    setSelectedInsight(id)
  }

  const closeModal = () => {
    setSelectedInsight(null)
  }

  const generateSummary = async () => {
    if (!insights.length) return;
    
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/insights/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          insights,
          focusArea
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      toast({
        title: "Summary Generated",
        description: "The summary has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveClick = (insight: Insight) => {
    setInsightToSave(insight)
    setShowSaveDialog(true)
  }

  const handleSaveSummary = () => {
    if (!summary || !focusArea) return

    // Get the title from the first line of the summary
    const summaryLines = summary.split('\n')
    const generatedTitle = summaryLines[0].trim()
    
    // Create the summary insight with the proper title and content
    const summaryInsight: Insight & { notes?: string } = {
      id: 'summary',
      title: generatedTitle,
      summary: summary.substring(generatedTitle.length).trim(),
      content: summary.substring(generatedTitle.length).trim().split('\n\n'),
      tags: [],
      readTime: '5 min',
      focus_area: focusArea,
      url: '', // Add empty url since it's a summary
      source: 'Generated Summary', // Add source to clarify it's a generated summary
      notes: summaryNotes // Include the notes from the textarea
    }

    setInsightToSave(summaryInsight)
    setShowSaveDialog(true)
  }

  // Add a function to check if user is premium
  const isPremiumUser = () => {
    // This is a placeholder - you would replace this with actual premium status check
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isPremiumUser') === 'true';
    }
    return false;
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Insights</h1>
        <CreateProjectDialog />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Search and Filters */}
        <div className="col-span-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search insights..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-w-[200px]"
                  />
                  <Button 
                    onClick={fetchInsights}
                    disabled={loading || isSearchLimitReached}
                    className="min-w-[100px]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
                {isSearchLimitReached && (
                  <p className="text-sm text-red-500">
                    Search limit reached. Please upgrade to premium for more searches.
                  </p>
                )}
                {!isSearchLimitReached && remainingSearchesCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {remainingSearchesCount} searches remaining
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Focus Area</label>
                <Select
                  value={focusArea}
                  onValueChange={(value: InsightFocusArea) => setFocusArea(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select focus area" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INSIGHT_FOCUS_AREAS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Industries</label>
                <MultiSelect
                  options={INDUSTRIES}
                  selected={selectedIndustries}
                  onChange={setSelectedIndustries}
                  placeholder="Select industries"
                  className="w-full"
                />
              </div>

              <Button
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="col-span-8">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Generated Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  {error}
                </div>
              ) : summary ? (
                <>
                  <div className="prose prose-sm max-w-none">
                    {summary.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={summaryNotes}
                      onChange={(e) => setSummaryNotes(e.target.value)}
                      placeholder="Add your notes here..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSaveSummary}
                    disabled={projectsLoading}
                  >
                    Save to Project
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Generate a summary to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <InsightModal
        isOpen={!!selectedInsight}
        onClose={closeModal}
        insight={insights.find(i => i.id === selectedInsight) || {
          id: 'empty',
          title: '',
          summary: '',
          content: [],
          tags: [],
          readTime: '0 min',
          focus_area: 'challenges-barriers',
          url: '',
          source: '',
          notes: ''
        }}
        isProjectsLoading={projectsLoading}
      />

      <SaveToProjectDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        insight={insightToSave || {
          id: 'empty',
          title: '',
          summary: '',
          content: [],
          tags: [],
          readTime: '0 min',
          focus_area: 'challenges-barriers',
          url: '',
          source: '',
          notes: ''
        }}
        isLoading={projectsLoading}
      />

      <InsightSearchUsageTracker
        onUsageUpdate={(count, limit, limitReached, isPremium) => {
          setIncrementUsageFunc(() => async () => {
            const response = await fetch('/api/subscription/increment-usage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ featureId: 'insight-search' })
            });
            const data = await response.json();
            return data.success && !data.limitReached;
          });
          setRemainingSearchesCount(limit - count);
          setIsSearchLimitReached(limitReached);
        }}
      />
    </div>
  )
} 