export type InsightFocusArea = 
  | 'stakeholder-impact'
  | 'risk-assessment'
  | 'communication'
  | 'timeline'
  | 'resources'
  | 'general'

export interface Insight {
  id: string
  title: string
  url: string | null
  summary: string
  content: string[]
  category: string
  tags: string[]
  readTime: string
  focus_area: InsightFocusArea
  source: string
  created_at: string
  updated_at: string
}

export interface SavedInsight extends Insight {
  project_id: string
  additional_notes: string | null
}

export interface InsightSummary {
  id: string
  project_id: string
  title: string
  content: string
  focus_area: InsightFocusArea
  created_at: string
  updated_at: string
} 