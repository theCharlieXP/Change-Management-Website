'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import type { Project, ProjectTask, ProjectNote } from '@/types/projects'
import { HybridDebug } from '../debug'
import { NavigationDiagnostic } from './diagnostic'

export default function HybridProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const projectId = params?.projectId as string

  // Debug mount - will show if the component is properly rendering
  useEffect(() => {
    console.log('HybridProjectPage mounted for projectId:', projectId);
    
    // Track if we're in the process of intentional navigation
    let isIntentionalNavigation = false;
    
    // Track if component is still mounted
    let isMounted = true;
    
    // Debug router usage
    const logRouterEvent = (event: string, data?: any) => {
      if (isMounted) {
        console.log(`HybridProjectPage router event [${event}]:`, {
          projectId,
          currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
          ...data
        });
      }
    };
    
    // Monitor for URL changes that might cause a reload/remount
    const handleRouteChange = (url: string) => {
      isIntentionalNavigation = true;
      logRouterEvent('routeChangeStart', { url });
    };
    
    // Add an event listener for URL changes
    if (typeof window !== 'undefined') {
      // For Next.js router events
      (window as any).addEventListener?.('routeChangeStart', handleRouteChange);
    }
    
    // Return a cleanup function that logs when the component unmounts
    return () => {
      console.log('HybridProjectPage UNMOUNTING for projectId:', projectId, {
        isIntentionalNavigation,
        currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        documentReadyState: typeof document !== 'undefined' ? document.readyState : 'unknown',
        hasRouterObject: !!router,
        timestamp: new Date().toISOString()
      });
      
      isMounted = false;
      
      // Remove the event listener
      if (typeof window !== 'undefined') {
        (window as any).removeEventListener?.('routeChangeStart', handleRouteChange);
      }
    };
  }, [projectId, router]);

  // Load data using our static route
  useEffect(() => {
    if (!isLoaded) {
      console.log('Hybrid project page: Auth not loaded yet');
      return;
    }
    
    console.log('Hybrid project page: Auth loaded, isSignedIn =', isSignedIn);
    setAuthChecked(true);
    
    if (!isSignedIn) {
      console.log('Hybrid project page: User not signed in, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }

    console.log('Hybrid project page: Starting to fetch project data for ID:', projectId);

    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        console.log('Hybrid project page: Attempting to fetch from static-project-data API');
        
        // Log the exact URL for debugging
        const apiUrl = `/static-project-data/${projectId}`;
        console.log('Hybrid project page: API URL:', apiUrl);
        
        try {
          // Use the dedicated static data route that bypasses client-side auth issues
          const response = await fetch(apiUrl, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            cache: 'no-store',
            credentials: 'include'
          });
          
          console.log('Hybrid project page: Response received', { 
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers])
          });
          
          if (!response.ok) {
            try {
              const errorData = await response.json();
              console.error('Hybrid project page: Error response from API', errorData);
              throw new Error(errorData.error || 'Failed to load project');
            } catch (jsonError) {
              console.error('Hybrid project page: Error parsing JSON from error response', jsonError);
              throw new Error(`Failed to load project: ${response.status} ${response.statusText}`);
            }
          }
          
          try {
            const data = await response.json();
            console.log('Hybrid project page: Data fetched successfully', { 
              hasProject: !!data.project,
              projectId: data.project?.id,
              projectTitle: data.project?.title,
              taskCount: data.tasks?.length,
              noteCount: data.notes?.length,
              debug: data.debug
            });
            
            // Set data in state
            setProject(data.project);
            setTasks(data.tasks || []);
            setNotes(data.notes || []);
            setError(null);
            console.log('Hybrid project page: State updated with project data');
          } catch (jsonError) {
            console.error('Hybrid project page: Error parsing JSON from successful response', jsonError);
            throw new Error('Failed to parse project data');
          }
        } catch (fetchError) {
          console.error('Hybrid project page: Error during fetch operation', fetchError);
          throw fetchError;
        }
      } catch (err) {
        console.error('Hybrid project page: Error loading project data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
        console.log('Hybrid project page: Loading completed, state =', {
          hasProject: !!project,
          loading,
          error,
          authChecked,
          isSignedIn
        });
      }
    };
    
    fetchProjectData();
  }, [isLoaded, isSignedIn, projectId, router, authChecked]);
  
  console.log('HybridProjectPage rendering with state:', {
    loading,
    hasProject: !!project,
    hasError: !!error,
    authChecked,
    isSignedIn,
    tasksCount: tasks.length,
    notesCount: notes.length
  });
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <HybridDebug />
        <NavigationDiagnostic projectId={projectId} />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">Loading Project</h2>
            <p className="text-gray-500">Please wait while we load your project data...</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (error || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <HybridDebug />
        <NavigationDiagnostic projectId={projectId} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Project</h2>
              <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
              <Button onClick={() => router.push('/dashboard/projects')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <main className="container mx-auto py-8 px-4">
      <HybridDebug />
      <NavigationDiagnostic projectId={projectId} />
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
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
                      checked={task.status === 'completed'} 
                      readOnly
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">{task.title}</div>
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
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => router.push('/dashboard/projects')}
              >
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 