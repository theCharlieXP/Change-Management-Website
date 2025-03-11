import { createClient } from '@supabase/supabase-js'
import type { Project, ProjectStatus, ProjectTask } from '@/types/projects'
import './supabase/config-check' // Import the configuration check

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a dummy client if configuration is missing
const createDummyClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') })
    },
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') })
    })
  } as any
}

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : createDummyClient()

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!url,
      hasAnonKey: !!key
    })
    return false
  }
  
  return true
}

// Helper function to get the current session
export async function getSupabaseSession() {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting Supabase session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Failed to get Supabase session:', error)
    return null
  }
}

// Helper function to get user data
export async function getSupabaseUser() {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting Supabase user:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Failed to get Supabase user:', error)
    return null
  }
}

// Helper function to check database connection
export async function checkSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Failed to test Supabase connection:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return false
  }
}

// Project related database functions
export async function getProjects(userId: string) {
  try {
    const response = await fetch('/api/projects')
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    return await response.json()
  } catch (error) {
    console.error('Error in getProjects:', error)
    throw error
  }
}

export async function getProject(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch project')
    }
    return await response.json()
  } catch (error) {
    console.error('Error in getProject:', error)
    throw error
  }
}

export async function createProject(userId: string, title: string) {
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title })
    })
    
    if (!response.ok) {
      throw new Error('Failed to create project')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error in createProject:', error)
    throw error
  }
}

export async function updateProject(projectId: string, updates: Partial<{
  title: string
  description: string
  status: ProjectStatus
}>) {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update project')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error in updateProject:', error)
    throw error
  }
}

export async function deleteProject(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete project')
    }
  } catch (error) {
    console.error('Error in deleteProject:', error)
    throw error
  }
}

// Task related database functions
export async function getProjectTasks(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}/tasks`)
    if (!response.ok) {
      throw new Error('Failed to fetch tasks')
    }
    return await response.json()
  } catch (error) {
    console.error('Error in getProjectTasks:', error)
    throw error
  }
}

export async function createProjectTask(projectId: string, task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('Creating task:', { projectId, task })
    
    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Error response from create task API:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      throw new Error(errorData.details || 'Failed to create task')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error in createProjectTask:', error)
    throw error
  }
}

export async function updateProjectTask(taskId: string, updates: Partial<ProjectTask>) {
  try {
    const projectId = updates.project_id || (await getProjectTaskDetails(taskId))?.project_id
    if (!projectId) {
      throw new Error('Project ID is required for updating task')
    }

    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: taskId, ...updates })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update task')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error in updateProjectTask:', error)
    throw error
  }
}

export async function deleteProjectTask(taskId: string) {
  try {
    const task = await getProjectTaskDetails(taskId)
    if (!task?.project_id) {
      throw new Error('Project ID not found for task')
    }

    const response = await fetch(`/api/projects/${task.project_id}/tasks?taskId=${taskId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete task')
    }
  } catch (error) {
    console.error('Error in deleteProjectTask:', error)
    throw error
  }
}

// Helper function to get task details
async function getProjectTaskDetails(taskId: string): Promise<ProjectTask | null> {
  try {
    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) {
      console.error('Error fetching task details:', error)
      return null
    }

    return data as ProjectTask
  } catch (error) {
    console.error('Error in getProjectTaskDetails:', error)
    return null
  }
}

// Note related database functions
export async function getProjectNotes(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}/notes`)
    if (!response.ok) {
      throw new Error('Failed to fetch notes')
    }
    return await response.json()
  } catch (error) {
    console.error('Error in getProjectNotes:', error)
    throw error
  }
}

export async function createProjectNote(projectId: string, note: { content: string }) {
  try {
    const response = await fetch(`/api/projects/${projectId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create note')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error in createProjectNote:', error)
    throw error
  }
}

export async function updateProjectNote(projectId: string, noteId: string, updates: { content: string }) {
  try {
    const response = await fetch(`/api/projects/${projectId}/notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: noteId, ...updates })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update note')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error in updateProjectNote:', error)
    throw error
  }
}

export async function deleteProjectNote(projectId: string, noteId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}/notes?noteId=${noteId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete note')
    }
  } catch (error) {
    console.error('Error in deleteProjectNote:', error)
    throw error
  }
} 