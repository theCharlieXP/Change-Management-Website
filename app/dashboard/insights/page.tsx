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
import { SaveToProjectDialog } from '@/components/save-to-project-dialog'

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
    setSummary(null)
    
    try {
      // Step 1: Initial search
      setLoadingStage("Initialising search...")
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (focusArea) params.append('focusArea', focusArea)
      if (selectedIndustries.length > 0) params.append('industries', selectedIndustries.join(','))

      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 2: Search and analysis
      setLoadingStage("Searching through trusted sources...")
      const response = await fetch(`/api/insights/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
      setLoadingStage("Analysing findings and identifying patterns...")

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

      await new Promise(resolve => setTimeout(resolve, 1000))
      setLoadingStage("Synthesising insights and creating summary...")

      // Extract results and summary from the response
      const { results, summary } = data
      
      // Update state with results and summary
      setInsights(results || [])
      setSummary(summary || null)

      // Show success message if we got results
      if (results.length > 0) {
        toast({
          title: "Search Complete",
          description: `Found ${results.length} relevant sources`,
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
      
      toast({
        title: "Error",
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

    // Get the generated title from the first line of the summary
    const generatedTitle = summary.split('\n\n')[0].trim()
    
    // Create the summary insight with the proper title
    const summaryInsight = {
      id: 'summary',
      title: generatedTitle, // Ensure we use the generated title
      summary: summary.split('\n\n').slice(1).join('\n\n'),
      content: summary.split('\n\n').slice(1),
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
              className="w-full bg-white border-input"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={fetchInsights}
            disabled={loading || !focusArea}
            className="w-32 bg-emerald-600 hover:bg-emerald-700 text-white"
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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

        {/* Single Loading Stage Indicator */}
        {loading && loadingStage && (
          <div className="mt-8 flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium text-primary">{loadingStage}</span>
            </div>
            <div className="text-xs text-muted-foreground text-center max-w-md">
              Please wait whilst we analyse multiple sources to provide you with comprehensive insights.
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="mt-8">
          {/* Summary Section */}
          {summary && (
            <div className="mb-8 bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-8">
                {summary.split('\n\n')[0].replace(/["']/g, '')}
              </h2>
              <div className="space-y-10">
                {summary.split('\n\n').slice(1).map((section, index) => {
                  if (section.startsWith('References:')) {
                    return null // We'll handle references separately
                  }
                  const [heading, ...points] = section.split('\n')
                  return (
                    <div key={index} className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">{heading.trim()}</h3>
                      <ul className="space-y-3">
                        {points.map((point, pointIndex) => (
                          <li key={pointIndex} className="text-base text-gray-700 flex items-start leading-relaxed">
                            <span className="mr-3 text-gray-400">•</span>
                            <span>{point.replace(/^[•-\s]+/, '').trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
                
                {/* Notes Section */}
                <div className="mt-10 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  <Textarea
                    placeholder="Add your notes about this summary here..."
                    value={summaryNotes}
                    onChange={(e) => setSummaryNotes(e.target.value)}
                    className="min-h-[100px] w-full text-base"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveSummary}
                      className="flex items-center gap-2"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                      Save to Project
                    </Button>
                  </div>
                </div>

                {/* References Section */}
                <div className="mt-10">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Links</h3>
                  <div className="grid gap-3">
                    {insights.map((insight, index) => (
                      <a
                        key={insight.id}
                        href={insight.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-base font-medium text-gray-700 mr-4 flex-1">
                          {index + 1}. {insight.title}
                        </span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
  )
} 