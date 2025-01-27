"use client"

import { useState } from "react"
import { Loader2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/components/ui/link"
import { cn } from "@/lib/utils"
import { DashboardLayout } from "@/components/dashboard-layout"

type CategoryKey = 
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

type TimeframeValue = 
  | 'last_day'
  | 'last_week'
  | 'last_month'
  | 'last_year'
  | 'custom'

const CATEGORIES: Record<CategoryKey, string> = {
  'challenges-barriers': 'Challenges & Barriers',
  'strategies-solutions': 'Strategies & Solutions',
  'outcomes-results': 'Outcomes & Results',
  'stakeholders-roles': 'Key Stakeholders & Roles',
  'best-practices': 'Best Practices & Methodologies',
  'lessons-learned': 'Lessons Learned & Insights',
  'implementation-tactics': 'Implementation Tactics',
  'communication-engagement': 'Communication & Engagement',
  'metrics-performance': 'Metrics & Performance Indicators',
  'risk-management': 'Risk Management & Mitigation',
  'technology-tools': 'Technology & Tools'
}

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
}

export default function InsightsPage() {
  const [query, setQuery] = useState("")
  const [timeframe, setTimeframe] = useState<TimeframeValue>()
  const [selectedIndustry, setSelectedIndustry] = useState<string>()
  const [category, setCategory] = useState<CategoryKey>()
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (timeframe) params.append('timeframe', timeframe)
      if (selectedIndustry) params.append('industry', selectedIndustry)
      if (category) params.append('category', category)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/insights/search?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }
      const data = await response.json()
      setInsights(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold">Insights Search</h1>
          
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                placeholder="Search insights..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
                disabled={loading}
              />
            </div>

            {/* Industry Filter */}
            <Select
              value={selectedIndustry}
              onValueChange={setSelectedIndustry}
              disabled={loading}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Industries</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={category}
              onValueChange={(value: CategoryKey) => setCategory(value)}
              disabled={loading}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key as CategoryKey}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            {/* Date Range Filter */}
            <Select
              value={timeframe}
              onValueChange={(value: TimeframeValue) => {
                setTimeframe(value)
                setStartDate(undefined)
                setEndDate(undefined)
              }}
              disabled={loading || (startDate !== undefined && endDate !== undefined)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_day">Last 24 Hours</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Range */}
            {timeframe === 'custom' && (
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Search Button */}
            <Button 
              onClick={fetchInsights}
              disabled={loading}
              className="w-full md:w-auto"
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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Results */}
          <div className="mt-8 space-y-6">
            {insights.length === 0 && !loading ? (
              <div className="text-center text-gray-500">
                {query || selectedIndustry || category ? 
                  'No results found. Try adjusting your search criteria.' : 
                  'Enter a search term or select filters to find insights.'}
              </div>
            ) : (
              insights.map((insight) => (
                <div key={insight.id} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold mb-2">{insight.title}</h2>
                    <Badge variant="secondary" className="ml-2">
                      {insight.readTime} min read
                    </Badge>
                  </div>
                  
                  <div className="prose max-w-none mt-4">
                    {insight.summary.split('\n').map((paragraph, index) => (
                      <p key={index} className="mt-2">{paragraph}</p>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge>{insight.category.name}</Badge>
                      {insight.tags?.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <Link href={insight.source} target="_blank" className="text-sm">
                      Read full article →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 