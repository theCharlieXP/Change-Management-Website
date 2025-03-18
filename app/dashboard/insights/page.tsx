"use client"

import { useState, useEffect } from "react"
import { Loader2, CalendarIcon, ChevronDown, ChevronUp, ExternalLink, BookmarkPlus, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
    const summaryInsight = {
      id: 'summary',
      title: generatedTitle,
      summary: summary.substring(generatedTitle.length).trim(),
      content: summary.substring(generatedTitle.length).trim().split('\n\n'),
      tags: [],
      readTime: '5 min',
      focus_area: focusArea,
      notes: summaryNotes,
      url: '', // Add empty url since it's a summary
      source: 'Generated Summary' // Add source to clarify it's a generated summary
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
    <InsightSearchUsageTracker>
      {({ 
        incrementUsage, 
        remainingSearches, 
        isLimitReached 
      }: { 
        incrementUsage: () => Promise<boolean>; 
        remainingSearches: number; 
        isLimitReached: boolean;
      }) => {
        // Update the tracker values when they change
        // This is safe because React will batch these updates
        if (
          trackerValues.incrementUsage !== incrementUsage ||
          trackerValues.remainingSearches !== remainingSearches ||
          trackerValues.isLimitReached !== isLimitReached
        ) {
          setTrackerValues({
            incrementUsage,
            remainingSearches,
            isLimitReached
          });
        }
        
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
                <p className="text-muted-foreground">
                  Search for insights on change management topics
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Search Criteria</h3>
                  <p className="text-sm text-muted-foreground">
                    Define your search to find relevant insights
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="focus-area" className="text-sm font-medium">
                      Insight Focus Area <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={focusArea}
                      onValueChange={(value) => setFocusArea(value as InsightFocusArea)}
                    >
                      <SelectTrigger id="focus-area">
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
                    <label htmlFor="query" className="text-sm font-medium">
                      Search Query
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        id="query"
                        placeholder="Enter keywords..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="industries" className="text-sm font-medium">
                      Industries (Optional)
                    </label>
                    <MultiSelect
                      options={INDUSTRIES}
                      selected={selectedIndustries}
                      onChange={setSelectedIndustries}
                      placeholder="Select industries..."
                    />
                  </div>

                  <Button 
                    onClick={fetchInsights} 
                    disabled={loading || !focusArea}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      "Search for Insights"
                    )}
                  </Button>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                      <div className="font-medium flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        Error
                      </div>
                      <div className="mt-1">
                        {error.includes('timed out') ? (
                          <div className="space-y-2">
                            <p>{error}</p>
                            <p className="text-xs font-medium mt-2">
                              Tips to resolve this issue:
                            </p>
                            <ul className="text-xs list-disc pl-4 space-y-1">
                              <li>Make your search query more specific (e.g., &ldquo;employee resistance strategies&rdquo; instead of just &ldquo;resistance&rdquo;)</li>
                              <li>Select only 1 industry instead of multiple</li>
                              <li>Try a different focus area that might have more targeted results</li>
                              <li>If you didn&apos;t enter a search query, add one to help focus the search</li>
                              <li>Wait a few minutes and try again - the search service might be experiencing high load</li>
                            </ul>
                          </div>
                        ) : (
                          error
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="w-full"
                    disabled={loading}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              <div className="md:col-span-3 space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-white p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Searching for Insights</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {loadingStage || "Processing your request..."}
                    </p>
                    <div className="w-full max-w-md">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                ) : insights.length > 0 ? (
                  <div className="space-y-6">
                    {summary && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Key Insights Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4 text-sm">
                            {summary.split('\n\n').map((section, sectionIndex) => {
                              // Check if this is a section header
                              const lines = section.split('\n');
                              const sectionHeader = lines[0];
                              const sectionContent = lines.slice(1);
                              
                              // Handle the title section (first section)
                              if (sectionIndex === 0) {
                                return (
                                  <h3 key={`section-${sectionIndex}`} className="font-medium text-base">
                                    {sectionHeader}
                                  </h3>
                                );
                              }
                              
                              return (
                                <div key={`section-${sectionIndex}`} className="space-y-2">
                                  <h4 className="font-medium">{sectionHeader}</h4>
                                  <div className="space-y-2">
                                    {sectionContent.map((point, pointIndex) => {
                                      const cleanPoint = point.replace(/^[-•]\s*/, '').trim();
                                      if (!cleanPoint) return null;
                                      
                                      // Special handling for References section to make links clickable
                                      if (sectionHeader === "References (with links)" || sectionHeader === "References") {
                                        // Try multiple patterns to extract URLs
                                        // First try the standard format: Source - http://url
                                        const standardUrlMatch = cleanPoint.match(/\s*-\s*(https?:\/\/[^\s]+)$/);
                                        
                                        if (standardUrlMatch) {
                                          const url = standardUrlMatch[1]; // Get the captured URL
                                          // Get everything before the URL (source name)
                                          const sourceName = cleanPoint.substring(0, cleanPoint.indexOf(' - ')).trim();
                                          
                                          return (
                                            <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                              <span className="text-muted-foreground">•</span>
                                              <span className="flex-1">
                                                {sourceName} - <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>
                                              </span>
                                            </div>
                                          );
                                        }
                                        
                                        // Also try to find any URL in the text if the standard format fails
                                        const anyUrlMatch = cleanPoint.match(/(https?:\/\/[^\s]+)/);
                                        if (anyUrlMatch) {
                                          const url = anyUrlMatch[1];
                                          // Remove the URL from the text to get the source name
                                          const textWithoutUrl = cleanPoint.replace(url, '').trim();
                                          const sourceName = textWithoutUrl.replace(/\s*-\s*$/, '').trim() || 'Source';
                                          
                                          return (
                                            <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                              <span className="text-muted-foreground">•</span>
                                              <span className="flex-1">
                                                {sourceName} <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>
                                              </span>
                                            </div>
                                          );
                                        }
                                        
                                        // If no URL was found, just display the text
                                        return (
                                          <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                            <span className="text-muted-foreground">•</span>
                                            <span className="flex-1">{cleanPoint}</span>
                                          </div>
                                        );
                                      }
                                      
                                      // Enhanced display for Key Findings, Patterns & Implications, and Practical Applications
                                      // These sections should have more prominent styling
                                      if (
                                        sectionHeader === "Key Findings" || 
                                        sectionHeader === "Patterns & Implications" || 
                                        sectionHeader === "Practical Applications"
                                      ) {
                                        return (
                                          <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                            <span className="text-primary font-bold">•</span>
                                            <span className="flex-1">{cleanPoint}</span>
                                          </div>
                                        );
                                      }
                                      
                                      // Default rendering for other sections
                                      return (
                                        <div key={`point-${pointIndex}`} className="flex items-start gap-2">
                                          <span className="text-muted-foreground">•</span>
                                          <span className="flex-1">{cleanPoint}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleSaveSummary}
                            >
                              <BookmarkPlus className="h-4 w-4 mr-2" />
                              Save Summary
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-white p-8">
                    <h3 className="text-lg font-medium mb-2">No Insights Found</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      {error ? 
                        "Please try adjusting your search criteria or try again later." : 
                        "Select a focus area and search to discover valuable insights for your change management initiatives."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Usage limit indicator */}
            {!isPremiumUser() && (
              <div className="text-sm mb-4">
                {isSearchLimitReached ? (
                  <div className="flex items-center text-amber-600 font-medium">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>You&apos;ve reached your Basic plan limit. <Link href="/dashboard/account" className="underline font-bold">Upgrade to Pro</Link></span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                    <span>
                      You have <span className="font-bold text-primary">{remainingSearchesCount}</span> free searches remaining
                      {remainingSearchesCount <= 5 && (
                        <span className="ml-2 text-amber-600">
                          <AlertCircle className="h-3 w-3 inline-block mr-1" />
                          Running low
                        </span>
                      )}
                    </span>
                    <Link href="/dashboard/account" className="text-xs text-primary underline">
                      Upgrade for more
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Add Save Dialog */}
            {showSaveDialog && insightToSave && (
              <SaveToProjectDialog
                open={showSaveDialog}
                onOpenChange={(open) => {
                  setShowSaveDialog(open)
                  if (!open) setInsightToSave(null)
                }}
                insight={insightToSave}
                isLoading={projectsLoading}
                isSummary={insightToSave.id === 'summary'}
              />
            )}
          </div>
        );
      }}
    </InsightSearchUsageTracker>
  )
} 