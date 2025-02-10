export type ProjectStatus = 
  | 'planning'
  | 'inprogress'
  | 'onhold'
  | 'completed'
  | 'cancelled'

export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'completed'
  | 'blocked'

export interface Project {
  id: string
  title: string
  description: string
  status: ProjectStatus
  created_at: string
  updated_at: string
  user_id: string
}

export interface ProjectInsight {
  id: string
  project_id: string
  title: string
  url: string | null
  summary: string
  additional_notes: string | null
  created_at: string
  updated_at: string
}

export interface ProjectSummary {
  id: string
  project_id: string
  content: string
  focus_area: string
  notes: string
  created_at: string
}

export interface ProjectTask {
  id: string
  project_id: string
  title: string
  description: string
  status: TaskStatus
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface ProjectNote {
  id: string
  project_id: string
  content: string
  created_at: string
  updated_at: string
} 