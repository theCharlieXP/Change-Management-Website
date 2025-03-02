import { useState } from 'react'
import { Search, Maximize2, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InsightSummary } from '@/types/insights'
import { INSIGHT_FOCUS_AREAS, InsightFocusArea } from '@/types/insights'

interface InsightSelectionProps {
  insights: InsightSummary[]
  selectedInsights: string[]
  onInsightSelect: (insightId: string) => void
  onViewInsight: (insight: InsightSummary) => void
  loading?: boolean
}

export function InsightSelection({ 
  insights, 
  selectedInsights, 
  onInsightSelect,
  onViewInsight,
  loading = false
}: InsightSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [focusAreaFilter, setFocusAreaFilter] = useState<string | null>(null)

  // Filter insights based on search term and focus area
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = searchTerm === '' || 
      insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFocusArea = focusAreaFilter === null || 
      insight.focus_area === focusAreaFilter
    
    return matchesSearch && matchesFocusArea
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading insights...</span>
      </div>
    )
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No insights available for this project</p>
      </div>
    )
  }

  return (
    <div className="insight-selection-container space-y-3 w-full overflow-hidden" style={{ maxWidth: "100%", width: "100%" }}>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search insights..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Button 
          variant={focusAreaFilter === null ? "default" : "outline"} 
          size="sm"
          className="h-7 text-xs px-2.5"
          onClick={() => setFocusAreaFilter(null)}
        >
          All
        </Button>
        {Object.entries(INSIGHT_FOCUS_AREAS).map(([key, { label }]) => (
          <Button
            key={key}
            variant={focusAreaFilter === key ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setFocusAreaFilter(focusAreaFilter === key ? null : key)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 w-full overflow-x-hidden" style={{ maxWidth: "100%" }}>
        {filteredInsights.length > 0 ? (
          filteredInsights.map((insight) => (
            <Card key={insight.id} className="insight-container overflow-hidden hover:shadow-md transition-shadow w-full" style={{ maxWidth: "100%" }}>
              <div className="flex items-start p-3">
                <Checkbox
                  id={`insight-${insight.id}`}
                  checked={selectedInsights.includes(insight.id)}
                  onCheckedChange={() => onInsightSelect(insight.id)}
                  className="mt-1 mr-2.5 flex-shrink-0"
                />
                <div 
                  className="flex-1 min-w-0 cursor-pointer overflow-hidden" 
                  onClick={(e) => {
                    // Prevent layout shifts by stopping event propagation
                    e.stopPropagation();
                    onViewInsight(insight);
                  }}
                  style={{ maxWidth: "calc(100% - 2.5rem)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <h4 className="font-medium text-sm truncate max-w-full">{insight.title}</h4>
                    {insight.focus_area && (
                      <Badge className={`${INSIGHT_FOCUS_AREAS[insight.focus_area as InsightFocusArea]?.color} flex-shrink-0`}>
                        {INSIGHT_FOCUS_AREAS[insight.focus_area as InsightFocusArea]?.label}
                      </Badge>
                    )}
                    <Maximize2 className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 break-words max-w-full">
                    {insight.content}
                  </p>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No insights found</p>
          </div>
        )}
      </div>
    </div>
  )
} 