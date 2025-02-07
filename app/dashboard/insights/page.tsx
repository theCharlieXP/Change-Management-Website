"use client"

import { useState } from "react"
import { Loader2, CalendarIcon, ChevronDown, ChevronUp, ExternalLink, BookmarkPlus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/components/ui/link"
import { cn } from "@/lib/utils"
import { MultiSelect } from "@/components/ui/multi-select"
import { InsightModal } from '@/components/insight-modal'

type InsightFocusArea = 
  | 'challenges-barriers'
  | 'strategies-solutions'
  | 'outcomes-results'
  | 'stakeholders-roles'
  | 'best-practices'
  | 'lessons-learned'
  | 'implementation-tactics'
  | 'communication-engagement'
  | 'metrics-performance'
  | 'risk-management'
  | 'technology-tools'
  | 'cultural-transformation'
  | 'change-leadership'
  | 'employee-training'
  | 'change-sustainability'

type TimeframeValue = 
  | 'last_day'
  | 'last_week'
  | 'last_month'
  | 'last_year'

const INSIGHT_FOCUS_AREAS: Record<InsightFocusArea, { label: string, description: string, color: string }> = {
  'challenges-barriers': {
    label: 'Challenges & Barriers',
    description: 'Resistance to change, resource constraints, technological limitations',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  'strategies-solutions': {
    label: 'Strategies & Solutions',
    description: 'Approaches to overcome obstacles, implementation methods, innovative practices',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'outcomes-results': {
    label: 'Outcomes & Results',
    description: 'ROI, productivity improvements, employee satisfaction metrics',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  'stakeholders-roles': {
    label: 'Key Stakeholders & Roles',
    description: 'Leadership involvement, employee participation, external partners',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  'best-practices': {
    label: 'Best Practices & Methodologies',
    description: 'Agile, Kotter\'s 8-Step Process, ADKAR model',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  'lessons-learned': {
    label: 'Lessons Learned & Insights',
    description: 'Successes and failures, actionable takeaways, case study reflections',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'implementation-tactics': {
    label: 'Implementation Tactics',
    description: 'Training programs, communication plans, technology deployment',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  'communication-engagement': {
    label: 'Communication & Engagement',
    description: 'Stakeholder communication strategies, employee engagement techniques, feedback mechanisms',
    color: 'bg-pink-100 text-pink-800 border-pink-200'
  },
  'metrics-performance': {
    label: 'Metrics & Performance Indicators',
    description: 'Key Performance Indicators (KPIs), performance metrics, adoption rates',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200'
  },
  'risk-management': {
    label: 'Risk Management & Mitigation',
    description: 'Risk identification, mitigation strategies, contingency planning',
    color: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  'technology-tools': {
    label: 'Technology & Tools',
    description: 'Project management software, communication platforms, analytics tools',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  'cultural-transformation': {
    label: 'Cultural Transformation',
    description: 'Shifting organizational culture, values alignment, behavior change',
    color: 'bg-violet-100 text-violet-800 border-violet-200'
  },
  'change-leadership': {
    label: 'Change Leadership',
    description: 'Leadership roles in change, leadership training, change champions',
    color: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  'employee-training': {
    label: 'Employee Training & Development',
    description: 'Skill development programs, training initiatives, continuous learning',
    color: 'bg-lime-100 text-lime-800 border-lime-200'
  },
  'change-sustainability': {
    label: 'Change Sustainability',
    description: 'Ensuring long-term change, embedding change into organizational processes',
    color: 'bg-teal-100 text-teal-800 border-teal-200'
  }
}

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

interface Insight {
  id: string
  title: string
  summary: string
  content: string
  category: {
    id: string
    name: string
  }
  createdAt: string
  readTime: number
  source: string
  tags: string[]
  focusArea: InsightFocusArea
}

export default function InsightsPage() {
  const [query, setQuery] = useState("")
  const [focusArea, setFocusArea] = useState<InsightFocusArea | undefined>(undefined)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedChangeFocus, setSelectedChangeFocus] = useState<string[]>([])
  const [timeframe, setTimeframe] = useState<TimeframeValue | undefined>(undefined)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Force a re-render when resetting
  const [resetKey, setResetKey] = useState(0)

  // Add state for modal
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)
  const [insightNotes, setInsightNotes] = useState<Record<string, string>>({})

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
    setInsights([])
    
    try {
      // Step 1: Prepare search
      setLoadingStage("Preparing search parameters...")
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (focusArea) params.append('focusArea', focusArea)
      if (selectedIndustries.length > 0) params.append('industries', selectedIndustries.join(','))
      if (selectedChangeFocus.length > 0) params.append('changeFocus', selectedChangeFocus.join(','))
      if (timeframe) params.append('timeframe', timeframe)

      // Step 2: Search
      setLoadingStage("Searching for relevant content...")
      const response = await fetch(`/api/insights/search?${params.toString()}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch insights: ${errorText}`)
      }

      // Step 3: Process results
      setLoadingStage("Processing search results...")
      const data = await response.json()
      
      if ('error' in data) {
        throw new Error(data.error)
      }

      // Step 4: Format results
      setLoadingStage("Formatting insights...")
      setInsights(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setInsights([])
    } finally {
      setLoading(false)
      setLoadingStage("")
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

  const handleSaveWithNotes = (id: string, notes: string) => {
    setInsightNotes(prev => ({ ...prev, [id]: notes }))
    // TODO: Implement project save functionality
    console.log('Save to project with notes:', { id, notes })
    closeModal()
  }

  return (
    <div className="container mx-auto py-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" key={resetKey}>
          {/* Insight Focus Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
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
            <label className="text-sm font-medium text-foreground">
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
            <label className="text-sm font-medium text-foreground">
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

          {/* Time Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
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
            <div className="text-xs text-muted-foreground mt-1">
              Note: Search results are limited to content from the past year due to API limitations.
            </div>
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <Link href={insight.source} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Full article
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          // TODO: Implement save to project functionality
                          console.log('Save to project:', insight.id)
                        }}
                      >
                        <BookmarkPlus className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                    <Badge className={cn("shrink-0", INSIGHT_FOCUS_AREAS[insight.focusArea].color)}>
                      {INSIGHT_FOCUS_AREAS[insight.focusArea].label}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedInsight && (
        <InsightModal
          insight={insights.find(i => i.id === selectedInsight)!}
          focusAreaInfo={INSIGHT_FOCUS_AREAS[insights.find(i => i.id === selectedInsight)!.focusArea]}
          isOpen={!!selectedInsight}
          onClose={closeModal}
          onSave={handleSaveWithNotes}
        />
      )}
    </div>
  )
} 