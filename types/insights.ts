export type InsightFocusArea = 
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

export interface Insight {
  id: string
  title: string
  summary: string
  content: string
  category?: {
    id: string
    name: string
  }
  createdAt: string
  readTime: number
  source: string
  tags: string[]
  focusArea: InsightFocusArea
} 