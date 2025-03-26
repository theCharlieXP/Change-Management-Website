import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function StaticProjectPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId
  console.log('Static project page rendering for ID:', projectId)

  // Auth check
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Create Supabase client - server-side only
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h1 className="text-xl font-bold text-red-800">Server Configuration Error</h1>
          <p className="text-red-700 mt-2">
            The server is missing required environment variables.
          </p>
          <Link 
            href="/dashboard/projects" 
            className="mt-4 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Back to Projects
          </Link>
        </div>
      </main>
    )
  }
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
  
  try {
    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()
    
    if (projectError || !project) {
      console.error('Project fetch error:', projectError)
      return (
        <main className="container mx-auto py-8 px-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
            <h1 className="text-xl font-bold text-amber-800">Project Not Found</h1>
            <p className="text-amber-700 mt-2">
              This project doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Link 
              href="/dashboard/projects" 
              className="mt-4 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Back to Projects
            </Link>
          </div>
        </main>
      )
    }
    
    // Fetch project tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true })
    
    if (tasksError) {
      console.error('Tasks fetch error:', tasksError)
    }
    
    // Fetch project notes
    const { data: notes, error: notesError } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (notesError) {
      console.error('Notes fetch error:', notesError)
    }
    
    // Return a simple static page with the project data
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/dashboard/projects" 
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ← 
          </Link>
          <h1 className="text-2xl font-bold">{project.title}</h1>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="mb-4">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {project.status || 'planning'}
            </span>
            <div className="mt-4 text-sm text-gray-500">
              <div>Created {format(new Date(project.created_at), 'PPP')}</div>
              <div>Last updated {format(new Date(project.updated_at), 'PPP')}</div>
            </div>
          </div>
          
          {project.description && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-gray-700">{project.description}</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7">
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Tasks</h2>
              {tasks && tasks.length > 0 ? (
                <ul className="space-y-3">
                  {tasks.map(task => (
                    <li key={task.id} className="flex items-start gap-2 py-2 border-b">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        readOnly
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{task.content}</div>
                        <div className="text-xs text-gray-500">
                          Added {format(new Date(task.created_at), 'PPP')}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No tasks added yet.</p>
              )}
              
              <Link 
                href={`/dashboard/projects/${projectId}`}
                className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Go to Interactive Project Page
              </Link>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              {notes && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map(note => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        Added {format(new Date(note.created_at), 'PPP')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No notes added yet.</p>
              )}
            </div>
          </div>
          
          <div className="md:col-span-5">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="space-y-2">
                <Link 
                  href={`/dashboard/projects/${projectId}`}
                  className="block w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center"
                >
                  Edit Project
                </Link>
                <Link 
                  href="/dashboard/projects"
                  className="block w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-center"
                >
                  Back to Projects
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
    
  } catch (error) {
    console.error('Error in static project page:', error)
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h1 className="text-xl font-bold text-red-800">Error Loading Project</h1>
          <p className="text-red-700 mt-2">
            An error occurred while trying to load the project data.
          </p>
          <Link 
            href="/dashboard/projects" 
            className="mt-4 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Back to Projects
          </Link>
        </div>
      </main>
    )
  }
} 