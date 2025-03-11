export type InsightFocusArea = 
  | 'challenges-barriers'
  | 'strategies-solutions'
  | 'outcomes-results'
  | 'key-stakeholders-roles'
  | 'best-practices-methodologies'
  | 'lessons-learned-insights'
  | 'implementation-tactics'
  | 'change-readiness'
  | 'change-sustainability'
  | 'communication-engagement'
  | 'metrics-performance'
  | 'risk-management'
  | 'technology-tools'
  | 'cultural-transformation'
  | 'change-leadership'
  | 'employee-training'

export const INSIGHT_FOCUS_AREAS: Record<InsightFocusArea, { 
  label: string
  color: string
  description: string
}> = {
  'challenges-barriers': {
    label: 'Challenges & Barriers',
    color: 'bg-red-100 text-red-800',
    description: 'Common obstacles and difficulties faced during change initiatives'
  },
  'strategies-solutions': {
    label: 'Strategies & Solutions',
    color: 'bg-blue-100 text-blue-800',
    description: 'Effective approaches and solutions for managing change'
  },
  'outcomes-results': {
    label: 'Outcomes & Results',
    color: 'bg-green-100 text-green-800',
    description: 'Measurable impacts and results of change initiatives'
  },
  'key-stakeholders-roles': {
    label: 'Key Stakeholders & Roles',
    color: 'bg-purple-100 text-purple-800',
    description: 'Important players and their responsibilities in change management'
  },
  'best-practices-methodologies': {
    label: 'Best Practices & Methodologies',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Proven methods and frameworks for successful change'
  },
  'lessons-learned-insights': {
    label: 'Lessons Learned & Insights',
    color: 'bg-orange-100 text-orange-800',
    description: 'Key learnings and insights from change initiatives'
  },
  'implementation-tactics': {
    label: 'Implementation Tactics',
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Specific techniques and approaches for implementing change'
  },
  'change-readiness': {
    label: 'Change Readiness',
    color: 'bg-pink-100 text-pink-800',
    description: 'Assessing and preparing organizations for change'
  },
  'change-sustainability': {
    label: 'Change Sustainability',
    color: 'bg-teal-100 text-teal-800',
    description: 'Ensuring changes are maintained and embedded in the organization'
  },
  'communication-engagement': {
    label: 'Communication & Engagement',
    color: 'bg-teal-100 text-teal-800',
    description: 'Effective communication and engagement strategies for change initiatives'
  },
  'metrics-performance': {
    label: 'Metrics & Performance',
    color: 'bg-teal-100 text-teal-800',
    description: 'Measuring and evaluating the performance of change initiatives'
  },
  'risk-management': {
    label: 'Risk Management',
    color: 'bg-teal-100 text-teal-800',
    description: 'Managing risks associated with change initiatives'
  },
  'technology-tools': {
    label: 'Technology & Tools',
    color: 'bg-teal-100 text-teal-800',
    description: 'Utilizing technology and tools for change initiatives'
  },
  'cultural-transformation': {
    label: 'Cultural Transformation',
    color: 'bg-teal-100 text-teal-800',
    description: 'Transforming organizational culture for change'
  },
  'change-leadership': {
    label: 'Change Leadership',
    color: 'bg-teal-100 text-teal-800',
    description: 'Leading and inspiring change initiatives'
  },
  'employee-training': {
    label: 'Employee Training',
    color: 'bg-teal-100 text-teal-800',
    description: 'Training and development of employees'
  }
}

export interface Insight {
  id: string
  title: string
  summary: string
  content: string[] | string
  category?: string
  tags: string[]
  readTime: number | string
  source?: string
  url?: string
  focus_area: InsightFocusArea
  created_at?: string
  updated_at?: string
}

export interface SavedInsight extends Insight {
  project_id: string
  additional_notes?: string
}

export interface InsightSummary {
  id: string
  project_id: string
  title: string
  content: string
  notes: string | null
  focus_area: InsightFocusArea
  created_at: string
  updated_at: string
  query?: string
  industries?: string[]
} 