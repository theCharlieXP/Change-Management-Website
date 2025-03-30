'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const { user } = useUser()
  const router = useRouter()
  const projectId = params.projectId
  const [projectData, setProjectData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Add navigation event listeners for debugging
  useEffect(() => {
    // Debug navigation
    const handlePopState = () => {
      console.log('Navigation detected: popstate to', window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    console.log('Project detail page mounted:', {
      projectId,
      pathname: window.location.pathname,
      userAuthenticated: !!user
    });
    
    // Anti-redirect safeguard
    const safeguardInterval = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/dashboard') {
        console.log('Project detail: Detected unwanted redirect, forcing back to project page');
        window.location.replace(`/dashboard/projects/${projectId}`);
      }
    }, 100);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(safeguardInterval);
    };
  }, [projectId, user]);
  
  useEffect(() => {
    console.log('PROJECT DETAIL PAGE LOADED', projectId);
    
    // Load project data
    const fetchData = async () => {
      try {
        const url = `/static-project-data/${projectId}`;
        console.log('Fetching project data from:', url);
        
        // Set specific headers to prevent redirects
        const response = await fetch(url, { 
          cache: 'no-store',
          headers: { 
            'x-no-redirect': 'true',
            'x-project-id': projectId
          }
        });
        
        console.log('Project data fetch response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to load project: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Project data loaded successfully:', data.project?.title);
        setProjectData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchData();
    } else {
      console.error('No project ID provided');
      setError('No project ID provided');
      setLoading(false);
    }
    
    return () => {
      console.log('PROJECT DETAIL PAGE UNMOUNTED');
    };
  }, [projectId]);
  
  if (loading) {
    return (
      <div className="p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Loading Project...</h1>
        <p>Project ID: {projectId}</p>
        <div className="mt-4 h-6 w-full bg-gray-200 animate-pulse rounded"></div>
        <div className="mt-2 h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }
  
  if (error || !projectData?.project) {
    return (
      <div className="p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Project</h1>
        <p className="mb-4">There was a problem loading the project details:</p>
        <p className="p-4 bg-red-50 border border-red-200 rounded">{error || 'Project not found'}</p>
        <button 
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={(e) => {
            e.preventDefault();
            console.log('Project detail: Navigating back to projects list');
            router.push('/dashboard/projects');
          }}
        >
          Back to Projects
        </button>
      </div>
    );
  }
  
  const project = projectData.project;
  const tasks = projectData.tasks || [];
  const notes = projectData.notes || [];
  
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{project.title}</h1>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={(e) => {
            e.preventDefault();
            console.log('Project detail: Navigating back to projects list');
            router.push('/dashboard/projects');
          }}
        >
          Back to Projects
        </button>
      </div>
      
      {project.description && (
        <div className="mb-6 p-4 bg-gray-50 rounded border">
          <h2 className="text-lg font-medium mb-2">Description</h2>
          <p className="text-gray-700">{project.description}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-3">Tasks ({tasks.length})</h2>
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task: any) => (
                <div key={task.id} className="p-3 border rounded">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-gray-500">
                    Status: {task.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tasks yet</p>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-3">Notes ({notes.length})</h2>
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note: any) => (
                <div key={note.id} className="p-3 border rounded">
                  <p>{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notes yet</p>
          )}
        </div>
      </div>
    </div>
  );
} 