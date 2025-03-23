"use client"

import { useState, useEffect, useRef } from "react"
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
import type { UsageTrackerRef } from '@/app/components/InsightSearchUsageTracker'

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

// Above the main component function, add the generateFallbackSummary function
const generateFallbackSummary = (searchResults: Insight[], searchQuery: string, focusArea: InsightFocusArea): string => {
  // Extract the focus area label
  const focusAreaLabel = INSIGHT_FOCUS_AREAS[focusArea].label;
  
  // Create a more descriptive title based on search query - keeping it to 10 words max and capitalized
  const capitalizedQuery = searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1).toLowerCase();
  // Limit to 10 words total
  const words = (capitalizedQuery + ' - ' + focusAreaLabel + ' Insights').split(' ');
  const title = `# ${words.slice(0, 10).join(' ')}`;
  
  // Create the context section (exactly what was searched, focus area)
  const context = `## Context
${searchQuery}, ${focusAreaLabel}`;
  
  // Create the insights section with bullet points from result summaries
  let insights = `## Insights`;
  
  // Extract key points from each result's summary
  const allPoints: string[] = [];
  searchResults.forEach(result => {
    // Extract sentences from the content/summary
    const content = result.content || result.summary;
    if (typeof content === 'string') {
      // Split content into sentences and clean them up
      const sentences = content.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 300); // Only keep reasonable length sentences
      
      // Combine sentences to make longer, more informative points
      if (sentences.length > 0) {
        // Combine every 2-3 sentences to create more comprehensive points
        for (let i = 0; i < sentences.length; i += 2) {
          if (i + 1 < sentences.length) {
            const combinedPoint = sentences[i] + '. ' + sentences[i+1] + '.';
            allPoints.push(combinedPoint);
          } else {
            allPoints.push(sentences[i] + '.');
          }
        }
      }
    }
  });
  
  // Create bullet points from the collected sentences (limit to 8 points)
  const uniquePoints = [...new Set(allPoints)]
    .filter(point => point.split(' ').length >= 15) // Only use points with at least 15 words
    .slice(0, 8);
  
  uniquePoints.forEach(point => {
    // Remove any trailing numbers that might be in the text
    const cleanedPoint = point.replace(/\s+\d+\s*\.?$/, '.');
    // Remove bullet characters at the end of sentences
    const formattedPoint = cleanedPoint.replace(/\s*·\s*\.$/, '.');
    insights += `\n• ${formattedPoint}`;
  });
  
  // Add a message if no points were found
  if (uniquePoints.length === 0) {
    insights += `\n• Change management projects require careful planning and execution to successfully implement new processes or systems within an organisation. Effective communication, stakeholder engagement, and measuring results are critical components for success.`;
    insights += `\n• Resistance to change is a common challenge that must be addressed through proper training, clear explanation of benefits, and involvement of employees in the change process to ensure smoother transitions.`;
    insights += `\n• Creating a detailed change management plan with specific milestones, responsibilities, and timelines helps organisations navigate the complexities of transformation whilst minimising disruption to ongoing operations.`;
  }
  
  // Create the references section with links to sources (without source description)
  let references = `## References`;
  searchResults.forEach(result => {
    if (result.title && result.url) {
      references += `\n• [${result.title}](${result.url})`;
    }
  });
  
  // Combine all sections
  return `${title}\n\n${context}\n\n${insights}\n\n${references}`;
};

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
  const [remainingSearchesCount, setRemainingSearchesCount] = useState<number>(20)
  const [isSearchLimitReached, setIsSearchLimitReached] = useState<boolean>(false)
  const usageTrackerRef = useRef<UsageTrackerRef>(null)
  // TODO: Set this back to false once the usage tracking API issues are resolved
  // Enable this flag to bypass usage checks during development or if the backend is not ready
  const bypassUsageCheck = true // Temporarily enabled to fix search functionality
  
  // Helper function to render markdown text with links
  const renderMarkdownText = (text: string) => {
    // Regular expression to find markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    if (!linkRegex.test(text)) {
      return text; // No links, return plain text
    }
    
    // Reset regex lastIndex
    linkRegex.lastIndex = 0;
    
    // Split the text into parts (links and non-links)
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the link
      const [fullMatch, linkText, linkUrl] = match;
      parts.push(
        <a 
          key={`link-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {linkText}
        </a>
      );
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // Add any remaining text after the last match
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return <>{parts}</>;
  };

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

  const handleUsageUpdate = (count: number, limit: number, limitReached: boolean, isPremium: boolean) => {
    setRemainingSearchesCount(limit - count)
    setIsSearchLimitReached(limitReached)
  }

  // Add a function to check Tavily API connectivity before search
  const checkTavilyConnection = async (): Promise<boolean> => {
    try {
      console.log('Testing Tavily API connectivity...');
      const response = await fetch('/api/test-tavily', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Tavily API test response status:', response.status);
      
      const responseData = await response.json();
      console.log('Tavily API test result:', responseData);
      
      if (!response.ok || !responseData.success) {
        console.error('Tavily API connection test failed:', responseData);
        
        // Detailed error message based on failure type
        let errorMessage = 'Could not connect to the search service. ';
        
        if (responseData.error?.includes('timed out')) {
          errorMessage += 'The connection timed out. This may be due to network issues or the service being temporarily unavailable.';
        } else if (responseData.error?.includes('API key')) {
          errorMessage += 'The API key is missing or invalid. Please contact support.';
        } else {
          errorMessage += 'Please try again later or contact support if the issue persists.';
        }
        
        toast({
          title: "Search Service Issue",
          description: errorMessage,
          variant: "destructive"
        });
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error testing Tavily API connection:', error);
      toast({
        title: "Connection Error",
        description: "Could not verify search service connectivity. Please check your internet connection and try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const fetchInsights = async () => {
    if (!query.trim()) return
    
    if (!focusArea) {
      toast({
        title: "Focus Area Required",
        description: "Please select a focus area before searching.",
        variant: "destructive"
      })
      return
    }

    // TEMPORARY: Force bypass usage check for debugging
    const bypassUsageCheck = true;
    
    if (!usageTrackerRef.current && !bypassUsageCheck) {
      console.error('Search functionality not available: usage tracker not initialized')
      return
    }

    setLoading(true)
    setLoadingStage('Checking search service availability...')
    setError(null)
    setSummary(null)
    setInsights([]) // Reset insights to prevent stale data

    try {
      // First check Tavily API connectivity
      const tavilyConnected = await checkTavilyConnection();
      if (!tavilyConnected) {
        setError('Search service is unavailable. Please try again later.');
        setLoading(false);
        setLoadingStage(null);
        return;
      }
      
      setLoadingStage('Checking usage limits...')
      
      // Check if we can perform the search
      let canSearch = true
      
      if (!bypassUsageCheck) {
        canSearch = await usageTrackerRef.current!.incrementUsage()
          .catch(err => {
            console.error('Error checking usage limits:', err)
            toast({
              title: "Error",
              description: "Failed to check usage limits. Please try again.",
              variant: "destructive"
            })
            return false
          })
      }
      
      if (!canSearch) {
        // If we can't search, it could be due to API error or limit reached
        if (isSearchLimitReached) {
          setError('You have reached your daily search limit. Please upgrade to continue searching.')
        } else {
          setError('Unable to verify search quota. Please try again.')
        }
        setLoading(false)
        return
      }

      setLoadingStage('Searching insights...')
      
      // Step 1: Initial search
      setLoadingStage("Initialising search...")
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (focusArea) params.append('focusArea', focusArea)
      if (selectedIndustries.length > 0) params.append('industries', selectedIndustries.join(','))
      
      // Add debug parameter if needed
      // params.append('debug', 'true') // Uncomment to enable detailed debugging

      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 2: Search and analysis
      setLoadingStage("Searching through trusted sources...")
      
      // Create an AbortController to handle client-side timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      let searchResults: Insight[] = [];
      
      try {
        console.log(`Fetching from: /api/insights/search?${params.toString()}`);
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
        
        // Add diagnostic logging
        const responseText = await response.clone().text();
        try {
          const debugData = JSON.parse(responseText);
          console.log('Debug - Search response data:', debugData);
          if (debugData.error) {
            console.error('API ERROR DETAILS:', debugData.details || 'No detailed error information');
            
            // Check for specific error types we can handle
            if (debugData.details && debugData.details.tavily_api_key_exists === false) {
              throw new Error('The search service API key is missing or invalid. Please contact support.');
            }
          }
        } catch (e) {
          console.log('Debug - Could not parse response as JSON:', responseText.substring(0, 500));
        }

        // Handle specific HTTP status codes
        if (response.status === 504) {
          throw new Error('The search request timed out. Please try a more specific query, fewer industries, or a different focus area.');
        }

        if (response.status === 404) {
          throw new Error('The search service is currently unavailable. Please try again later.');
        }

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            console.error('Search API error details:', errorData);
            
            // Extract API key information for better error reporting
            if (errorData.details && typeof errorData.details === 'object') {
              const keyInfo = {
                exists: errorData.details.tavily_api_key_exists,
                prefix: errorData.details.tavily_api_key_prefix,
                env: errorData.details.environment
              };
              console.log('API key diagnostic info:', keyInfo);
              
              // Special handling for common errors
              if (keyInfo.exists === false) {
                errorMessage = 'The search service API key is missing. Please contact support.';
              } else if (errorData.details.message && errorData.details.message.includes('Network error')) {
                errorMessage = 'Could not connect to the search service. Please check your internet connection or try again later.';
              } else if (errorData.details.name === 'AbortError') {
                errorMessage = 'The search request timed out. Please try a more specific query or try again later.';
              } else {
                errorMessage = errorData.error || errorData.details?.message || errorMessage;
              }
            } else {
              errorMessage = errorData.error || errorData.details || errorMessage;
            }
            
            // Try fallback to basic search if main search fails with 500
            if (response.status === 500) {
              console.log('Main search endpoint failed with 500, trying simplified endpoint...');
              setLoadingStage("Trying alternative search method...");
              
              // Try the simplified search endpoint
              const basicParams = new URLSearchParams();
              basicParams.append('query', query);
              
              const backupResponse = await fetch(`/api/insights/search-basic?${basicParams.toString()}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: 'include'
              });
              
              if (backupResponse.ok) {
                console.log('Backup search succeeded!');
                const backupData = await backupResponse.json();
                
                if (backupData.results && backupData.results.length > 0) {
                  // Transform the basic results to match the expected format
                  const transformedResults = backupData.results.map((result: any) => ({
                    id: Math.random().toString(36).substring(2, 9),
                    title: result.title || 'Untitled',
                    summary: result.content || '',
                    content: result.content || '',
                    url: result.url || '',
                    source: result.source || new URL(result.url || 'https://example.com').hostname,
                    focus_area: focusArea,
                    readTime: Math.ceil((result.content?.split(' ')?.length || 0) / 200) || '5 min',
                    tags: focusArea ? [INSIGHT_FOCUS_AREAS[focusArea].label] : ['General'],
                    created_at: new Date().toISOString()
                  }));
                  
                  searchResults = transformedResults;
                  
                  // Skip throwing the error since we recovered
                  // but continue with summary generation
                  return; // Early return to prevent the error being thrown below
                }
              } else {
                console.log('Backup search also failed:', backupResponse.status);
              }
            }
            
          } catch (e) {
            // If we can't parse the JSON, just use the default error message
            console.error('Error parsing error response:', e);
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if ('error' in data) {
          console.error('Search error in response data:', data);
          throw new Error(data.error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingStage("Analysing findings from Tavily search...");

        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingStage("Synthesising insights and creating summary with DeepSeek...");

        // Extract results and summary from the response
        const { results, query: searchQuery, focusArea: searchFocusArea } = data;
        
        // Update state with results
        searchResults = results || [];

        // Store the search query and focus area for the summary generation
        const searchContext = {
          query: searchQuery || query,
          focusArea: searchFocusArea || focusArea
        };

        // Store search context for summary generation
        sessionStorage.setItem('lastSearchContext', JSON.stringify(searchContext));
        
        // Generate summary for the search results
        setLoadingStage("Generating comprehensive summary using Tavily search results with DeepSeek...");
        try {
          const summaryResponse = await fetch('/api/insights/summarize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              insights: searchResults,
              focusArea,
              searchInfo: {
                query: searchContext.query,
                focusArea: searchContext.focusArea,
                industries: selectedIndustries
              },
              format: {
                sections: [
                  {
                    title: "Context",
                    description: "Exactly what was searched, focus area selected, and industries selected (if applicable)"
                  },
                  {
                    title: "Insights",
                    description: "7-10 comprehensive bullet points written by a change management expert"
                  },
                  {
                    title: "References",
                    description: "List of all sources with markdown links"
                  }
                ],
                style: "Use clean markdown formatting with minimal excess text. Use bullet points (•) for Insights. Write as a senior change management consultant in UK English."
              }
            })
          });
    
          if (!summaryResponse.ok) {
            console.error('Error generating summary:', summaryResponse.status);
            throw new Error('Failed to generate summary. The summarize API returned an error.');
          }

          const summaryData = await summaryResponse.json();
          setSummary(summaryData.summary);
        } catch (error) {
          console.error('Error generating summary:', error);
          // Generate a fallback summary from search results when DeepSeek API fails
          const fallbackSummary = generateFallbackSummary(
            searchResults, 
            searchContext.query || query, 
            searchContext.focusArea as InsightFocusArea || focusArea as InsightFocusArea
          );
          setSummary(fallbackSummary);
          
          toast({
            title: "Notice",
            description: "Generated a simple summary due to an error with the advanced summarization service.",
            variant: "default"
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          setError('The search request was cancelled. Please try again with a more specific query.');
          setLoading(false);
          setLoadingStage(null);
          return;
        } else if (error.message.includes('timed out')) {
          setError('The search request timed out. Please try a more specific query, fewer industries, or a different focus area.');
          setLoading(false);
          setLoadingStage(null);
          return;
        }
        
        // Pass the error up to be handled by the outer catch block
        throw error;
      }

      // Update state with results
      setInsights(searchResults);

      // Show success message if we got results
      if (searchResults.length > 0) {
        toast({
          title: "Search Complete",
          description: `Found ${searchResults.length} relevant sources`,
        });
      } else {
        toast({
          title: "No Results",
          description: "Try adjusting your search criteria or selecting different filters",
          variant: "destructive"
        });
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
    } finally {
      setLoading(false);
      setLoadingStage(null);
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

    // Extract the title from the markdown format
    const summaryLines = summary.split('\n')
    let generatedTitle = ''
    
    // Try to find the first heading
    for (const line of summaryLines) {
      if (line.startsWith('# ')) {
        generatedTitle = line.substring(2).trim()
        break
      }
    }
    
    // Fallback if no title found
    if (!generatedTitle) {
      generatedTitle = `Summary on ${INSIGHT_FOCUS_AREAS[focusArea].label}`
    }
    
    // Create the summary insight with the proper title and content
    const summaryInsight: Insight & { notes?: string } = {
      id: 'summary',
      title: generatedTitle,
      summary: summary.replace(generatedTitle, '').trim(),
      content: summary.split('\n\n'),
      tags: [INSIGHT_FOCUS_AREAS[focusArea].label, 'Summary'],
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
        
        {process.env.NODE_ENV === 'development' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={checkTavilyConnection}
            className="text-xs"
          >
            Test Search API
          </Button>
        )}
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
                    disabled={loading || (!bypassUsageCheck && isSearchLimitReached) || !focusArea}
                    className="min-w-[100px]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>
                {!bypassUsageCheck && isSearchLimitReached && (
                  <p className="text-sm text-red-500">
                    You have reached your daily search limit. Please upgrade to continue searching.
                  </p>
                )}
                {bypassUsageCheck ? (
                  <p className="text-sm text-muted-foreground">
                    Usage tracking temporarily disabled
                  </p>
                ) : !isSearchLimitReached && remainingSearchesCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {remainingSearchesCount} searches remaining today
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
                className="w-full bg-white hover:bg-gray-50"
                variant="outline"
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
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <div className="text-center">
                    <p className="font-medium">{loadingStage || 'Loading...'}</p>
                    {loadingStage && loadingStage.includes("test data") && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Using sample data because the search API is currently unavailable.
                      </p>
                    )}
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  {error}
                </div>
              ) : summary ? (
                <>
                  <div className="prose prose-sm max-w-none">
                    {summary.split('\n').map((paragraph, index) => {
                      // Format markdown headings properly
                      if (paragraph.startsWith('# ')) {
                        return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{paragraph.substring(2)}</h1>;
                      } else if (paragraph.startsWith('## ')) {
                        return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{paragraph.substring(3)}</h2>;
                      } else if (paragraph.startsWith('### ')) {
                        return <h3 key={index} className="text-lg font-bold mt-3 mb-1">{paragraph.substring(4)}</h3>;
                      } else if (paragraph.startsWith('- ')) {
                        // Handle bullet points, including those that might contain markdown links
                        const content = paragraph.substring(2);
                        return (
                          <li key={index} className="ml-4">
                            {renderMarkdownText(content)}
                          </li>
                        );
                      } else if (/^\d+\.\s/.test(paragraph)) {
                        // Match numbered lists (e.g., "1. Item")
                        const content = paragraph.replace(/^\d+\.\s/, '');
                        return (
                          <li key={index} className="ml-4 list-decimal">
                            {renderMarkdownText(content)}
                          </li>
                        );
                      } else if (paragraph.trim() === '') {
                        return <div key={index} className="h-2"></div>; // Space for empty lines
                      } else {
                        // Handle regular paragraphs, including those that might contain markdown links
                        return <p key={index}>{renderMarkdownText(paragraph)}</p>;
                      }
                    })}
                  </div>
                  <div className="space-y-2 mt-6">
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={summaryNotes}
                      onChange={(e) => setSummaryNotes(e.target.value)}
                      placeholder="Add your notes here..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button
                    className="w-full mt-4"
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
        ref={usageTrackerRef}
        onUsageUpdate={handleUsageUpdate}
      />

      {loading && (
        <div className="w-full my-8 py-4 flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center">
            <div className="absolute -top-10 right-0">
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    // Force a search with debug mode
                    const params = new URLSearchParams(window.location.search);
                    params.set('debug', 'true');
                    params.set('bypass', 'true');
                    window.location.search = params.toString();
                  }}
                >
                  Debug
                </Button>
              )}
            </div>
            
            <Loader2 className="h-16 w-16 animate-spin text-emerald-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">{loadingStage || 'Searching...'}</h3>
            
            {/* Show debug info in URL contains debug=true */}
            {new URLSearchParams(window.location.search).get('debug') === 'true' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border text-xs text-left w-full max-w-2xl">
                <h4 className="font-semibold mb-2">Debug Info:</h4>
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify({
                    env: process.env.NODE_ENV,
                    time: new Date().toISOString(),
                    query: query,
                    focusArea: focusArea,
                    industries: selectedIndustries,
                    loadingStage: loadingStage
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 