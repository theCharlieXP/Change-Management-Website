export type InsightFocusArea = 
  | 'challenges-barriers'
  | 'strategies-solutions'
  | 'outcomes-results'
  | 'key-stakeholders-roles'
  | 'best-practices-methodologies'
  | 'lessons-learned-insights'
  | 'implementation-tactics'
  | 'communication-engagement'
  | 'metrics-performance'
  | 'risk-management'
  | 'technology-tools'
  | 'cultural-transformation'
  | 'change-leadership'
  | 'employee-training'
  | 'change-sustainability'

export const INSIGHT_FOCUS_AREAS: Record<InsightFocusArea, { label: string; color: string }> = {
  'challenges-barriers': { 
    label: 'Challenges & Barriers',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  'strategies-solutions': { 
    label: 'Strategies & Solutions',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'outcomes-results': { 
    label: 'Outcomes & Results',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  'key-stakeholders-roles': { 
    label: 'Key Stakeholders & Roles',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  'best-practices-methodologies': { 
    label: 'Best Practices & Methodologies',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'lessons-learned-insights': { 
    label: 'Lessons Learned & Insights',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  'implementation-tactics': { 
    label: 'Implementation Tactics',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  'communication-engagement': { 
    label: 'Communication & Engagement',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  'metrics-performance': { 
    label: 'Metrics & Performance',
    color: 'bg-pink-100 text-pink-800 border-pink-200'
  },
  'risk-management': { 
    label: 'Risk Management',
    color: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  'technology-tools': { 
    label: 'Technology & Tools',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200'
  },
  'cultural-transformation': { 
    label: 'Cultural Transformation',
    color: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  'change-leadership': { 
    label: 'Change Leadership',
    color: 'bg-violet-100 text-violet-800 border-violet-200'
  },
  'employee-training': { 
    label: 'Employee Training & Development',
    color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'
  },
  'change-sustainability': { 
    label: 'Change Sustainability',
    color: 'bg-sky-100 text-sky-800 border-sky-200'
  }
}

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
  notes?: string
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