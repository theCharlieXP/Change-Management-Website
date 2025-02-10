import { createClient } from '@supabase/supabase-js'
import type { Project, ProjectStatus, ProjectTask } from '@/types/projects'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get an authenticated Supabase client with user's JWT
export async function getAuthenticatedClient() {
  try {
    const response = await fetch('/api/supabase-token')
    if (!response.ok) {
      throw new Error(`Failed to get Supabase token: ${response.statusText}`)
    }
    
    const { supabaseAccessToken, tokenType, tokenLength } = await response.json()
    
    if (!supabaseAccessToken) {
      throw new Error('No Supabase access token available')
    }

    // Log token info for debugging
    console.log('Token info:', { tokenType, tokenLength })

    // Create a new client with the JWT token
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAccessToken}`
        }
      }
    })

    return client
  } catch (error) {
    console.error('Error getting authenticated client:', error)
    throw error
  }
}

// Project related database functions
export async function createProject(userId: string, title: string, description: string = '') {
  const client = await getAuthenticatedClient()
  try {
    const { data, error } = await client
      .from('projects')
      .insert([
        {
          title,
          description,
          status: 'planning' as ProjectStatus,
          user_id: userId,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw new Error(error.message)
    }
    return data as Project
  } catch (error) {
    console.error('Error in createProject:', error)
    throw error
  }
}

export async function getProjects(userId: string) {
  const client = await getAuthenticatedClient()
  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw new Error(error.message)
    }
    return (data || []) as Project[]
  } catch (error) {
    console.error('Error in getProjects:', error)
    throw error
  }
}

export async function getProject(projectId: string) {
  const client = await getAuthenticatedClient()
  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Project not found
      }
      console.error('Error fetching project:', error)
      throw new Error(error.message)
    }
    return data as Project
  } catch (error) {
    console.error('Error in getProject:', error)
    throw error
  }
}

export async function updateProject(projectId: string, updates: Partial<{
  title: string
  description: string
  status: ProjectStatus
}>) {
  const client = await getAuthenticatedClient()
  const { data, error } = await client
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error)
    throw error
  }
  return data as Project
}

export async function deleteProject(projectId: string) {
  const client = await getAuthenticatedClient()
  const { error } = await client
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

// Task related database functions
export async function getProjectTasks(projectId: string) {
  const client = await getAuthenticatedClient()
  try {
    const { data, error } = await client
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error.message)
      console.error('Error details:', error)
      throw new Error(error.message)
    }
    return (data || []) as ProjectTask[]
  } catch (error) {
    console.error('Error in getProjectTasks:', error)
    throw error
  }
}

export async function createProjectTask(projectId: string, task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) {
  const client = await getAuthenticatedClient()
  const { data, error } = await client
    .from('project_tasks')
    .insert([
      {
        ...task,
        project_id: projectId,
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error.message)
    console.error('Error details:', error)
    throw error
  }
  return data as ProjectTask
}

export async function updateProjectTask(taskId: string, updates: Partial<ProjectTask>) {
  const client = await getAuthenticatedClient()
  const { data, error } = await client
    .from('project_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error updating task:', error.message)
    console.error('Error details:', error)
    throw error
  }
  return data as ProjectTask
}

export async function deleteProjectTask(taskId: string) {
  const client = await getAuthenticatedClient()
  const { error } = await client
    .from('project_tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error.message)
    console.error('Error details:', error)
    throw error
  }
} 