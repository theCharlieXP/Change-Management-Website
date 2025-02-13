"use client"

import { useState, useEffect } from "react"
import { Loader2, CalendarIcon, ChevronDown, ChevronUp, ExternalLink, BookmarkPlus } from "lucide-react"
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

const CHANGE_FOCUS = [
  'Digital Transformation',
  'Organisational Restructuring',
  'Cultural Change',
  'Mergers & Acquisitions',
  'Process Optimization',
  'Technology Implementation',
  'Leadership Development',
  'Employee Engagement',
  'Change Communication',
  'Strategic Planning',
  'Sustainability Initiatives',
  'Diversity & Inclusion Programs',
  'Crisis Management',
  'Remote Work Transition',
  'Innovation Management',
  'Customer Experience Enhancement',
  'Supply Chain Transformation',
  'Talent Management',
  'Regulatory Compliance',
  'Product Development'
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
  const [selectedChangeFocus, setSelectedChangeFocus] = useState<string[]>([])
  const [timeframe, setTimeframe] = useState<TimeframeValue | undefined>(undefined)
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

  // Fetch projects when auth is ready
  useEffect(() => {
    let isMounted = true
    
    const fetchProjects = async () => {
      // Skip if auth isn't ready
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
    setSelectedChangeFocus([])
    setTimeframe(undefined)
    
    // Force a re-render of all components
    setResetKey(prev => prev + 1)
  }

  const fetchInsights = async () => {
    if (!focusArea) {
      setError('Please select an Insight Focus Area')
      return
    }

    setError(null)
    setLoading(true)
    // Don't clear insights immediately to prevent UI flicker
    
    try {
      // Step 1: Prepare search
      setLoadingStage("Preparing search parameters...")
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (focusArea) params.append('focusArea', focusArea)
      if (selectedIndustries.length > 0) params.append('industries', selectedIndustries.join(','))
      if (selectedChangeFocus.length > 0) params.append('changeFocus', selectedChangeFocus.join(','))
      if (timeframe) params.append('timeframe', timeframe)

      console.log('Search parameters:', Object.fromEntries(params.entries()))

      // Step 2: Search
      setLoadingStage("Searching for relevant content...")
      const response = await fetch(`/api/insights/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // This ensures cookies are sent with the request
      })
      
      // Log response status
      console.log('Search response status:', response.status)

      const data = await response.json()
      
      if (!response.ok) {
        console.error('Search error response:', data)
        throw new Error(data.error || data.details || `HTTP error! status: ${response.status}`)
      }

      if ('error' in data) {
        console.error('Search error in response data:', data)
        throw new Error(data.error)
      }

      // Step 3: Process results
      setLoadingStage("Processing search results...")
      
      // Step 4: Format results
      setLoadingStage("Formatting insights...")
      const formattedInsights = Array.isArray(data) ? data : []
      console.log('Formatted insights:', {
        count: formattedInsights.length,
        firstInsight: formattedInsights[0] ? {
          title: formattedInsights[0].title,
          focusArea: formattedInsights[0].focus_area,
          hasContent: !!formattedInsights[0].content
        } : null
      })
      
      // Only update insights if we have results or explicitly got an empty array
      if (formattedInsights || data.length === 0) {
        setInsights(formattedInsights)
      }

      // Show success message if we got results
      if (formattedInsights.length > 0) {
        toast({
          title: "Search Complete",
          description: `Found ${formattedInsights.length} relevant insights`,
        })
      } else {
        toast({
          title: "No Results",
          description: "Try adjusting your search criteria or selecting different filters",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Search error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      // Don't clear insights on error
      
      // Show toast with error
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingStage(null)
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

  const handleSave = async () => {
    // TODO: Implement save functionality
    // For now, just close the modal
    closeModal()
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Insights Search</h1>
        
        {/* Search Bar and Button */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <Input 
              placeholder="Search insights..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={fetchInsights}
            disabled={loading || !focusArea}
            className="w-32"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Loading Stage Indicator */}
        {loading && loadingStage && (
          <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">{loadingStage}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              This may take a few moments...
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Insight Focus Area <span className="text-red-500">*</span>
            </label>
            <Select
              value={focusArea}
              onValueChange={(value: InsightFocusArea) => setFocusArea(value)}
              disabled={loading}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Focus Area" />
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

          {/* Industry Multi-select */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Industry
            </label>
            <MultiSelect
              options={INDUSTRIES}
              selected={selectedIndustries}
              onChange={setSelectedIndustries}
              placeholder="Select Industries"
              disabled={loading}
              className="h-9"
            />
          </div>

          {/* Change Focus Multi-select */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Change Focus
            </label>
            <MultiSelect
              options={CHANGE_FOCUS}
              selected={selectedChangeFocus}
              onChange={setSelectedChangeFocus}
              placeholder="Select Change Focus"
              disabled={loading}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Time Range
            </label>
            <Select
              value={timeframe}
              onValueChange={(value: TimeframeValue) => setTimeframe(value)}
              disabled={loading}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_day">Last 24 Hours</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset Filters Button */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={resetFilters}
            disabled={loading}
            type="button"
          >
            Reset Filters
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="mt-8">
          {insights.length > 0 && (
            <div className="mb-6 flex justify-end">
              <Button
                onClick={generateSummary}
                disabled={isSummarizing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  'Summarise Results'
                )}
              </Button>
            </div>
          )}

          {summary && (
            <div className="mb-8 bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Summary of Results</h2>
              <div className="space-y-8">
                {summary.split('\n\n').map((section, index) => {
                  const [heading, ...points] = section.split('\n');
                  return (
                    <div key={index} className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900">{heading}</h3>
                      <ul className="space-y-2">
                        {points.map((point, pointIndex) => (
                          <li key={pointIndex} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{point.replace(/^[-•]\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                  <Textarea
                    placeholder="Add your notes about this summary here..."
                    value={summaryNotes}
                    onChange={(e) => setSummaryNotes(e.target.value)}
                    className="min-h-[100px] w-full"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setSelectedInsight('summary')}
                      className="flex items-center gap-2"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                      Save to Project
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.length === 0 && !loading ? (
              <div className="col-span-full text-center text-gray-500">
                {query || focusArea ? 
                  'No results found. Try adjusting your search criteria or selecting different filters.' : 
                  'Select an Insight Focus Area and start searching.'}
              </div>
            ) : (
              insights.map((insight) => (
                <div 
                  key={insight.id} 
                  className="bg-white rounded-lg border transition-all duration-200 hover:shadow-lg"
                >
                  <div className="p-4 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex flex-col gap-2 mb-3">
                      <h2 className="text-lg font-semibold">
                        {insight.title.replace(/["']/g, '')}
                      </h2>
                    </div>

                    {/* Preview */}
                    <div className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {insight.summary.split('\n')[0]?.replace(/^[•-]\s*/, '')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t flex items-end justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(insight.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Expand
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Link href={insight.url || '#'} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Full article
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedInsight(insight.id)}
                        >
                          <BookmarkPlus className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                      <Badge className={cn("shrink-0", INSIGHT_FOCUS_AREAS[insight.focus_area].color)}>
                        {INSIGHT_FOCUS_AREAS[insight.focus_area].label}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedInsight && (
        <InsightModal
          insight={selectedInsight === 'summary' ? {
            id: 'summary',
            title: 'Search Results Summary',
            summary: summary || '',
            content: summary?.split('\n\n') || [],
            tags: [],
            readTime: '5 min',
            focus_area: focusArea!,
            notes: summaryNotes || undefined
          } : insights.find(i => i.id === selectedInsight)!}
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          isProjectsLoading={projectsLoading}
          isSummary={selectedInsight === 'summary'}
        />
      )}
    </div>
  )
} 