'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const { user } = useUser()
  const projectId = params.projectId
  const [projectData, setProjectData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Ultra-strong anti-redirect protection
  useEffect(() => {
    console.log('MINIMAL PROJECT DETAIL PAGE LOADED', projectId);
    
    // Override navigation methods to prevent any redirects
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Protect against navigation attempts
    history.pushState = function(data, title, url) {
      console.log('pushState intercepted:', url);
      if (url === '/' || url === '/dashboard') {
        console.log('BLOCKED pushState redirect to root');
        return originalPushState.call(this, data, title, window.location.pathname);
      }
      return originalPushState.call(this, data, title, url);
    };
    
    history.replaceState = function(data, title, url) {
      console.log('replaceState intercepted:', url);
      if (url === '/' || url === '/dashboard') {
        console.log('BLOCKED replaceState redirect to root');
        return originalReplaceState.call(this, data, title, window.location.pathname);
      }
      return originalReplaceState.call(this, data, title, url);
    };
    
    // Block location changes directly
    const originalDescriptor = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
    if (originalDescriptor && originalDescriptor.set) {
      Object.defineProperty(window.Location.prototype, 'href', {
        set(url) {
          console.log('Location.href setter intercepted:', url);
          if (url === '/' || url === '/dashboard') {
            console.log('BLOCKED location.href change to root');
            return;
          }
          if (originalDescriptor.set) {
            originalDescriptor.set.call(this, url);
          }
        },
        get: originalDescriptor.get,
        configurable: true
      });
    }
    
    // Redirect guard - check if we somehow got redirected to the root and redirect back
    const redirectGuard = setInterval(() => {
      if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
        console.log('REDIRECT GUARD: Caught unwanted navigation to root!');
        window.location.replace(`/dashboard/projects-v2/${projectId}`);
      }
    }, 100);
    
    // Load project data
    const fetchData = async () => {
      try {
        const url = `/static-project-data/${projectId}`;
        console.log('Fetching project data from:', url);
        
        const response = await fetch(url, { 
          cache: 'no-store',
          headers: { 'x-no-redirect': 'true' }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load project: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Project data loaded:', data.project?.title);
        setProjectData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      
      if (originalDescriptor) {
        Object.defineProperty(window.Location.prototype, 'href', originalDescriptor);
      }
      
      clearInterval(redirectGuard);
      
      console.log('MINIMAL PROJECT DETAIL PAGE UNMOUNTED');
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
          onClick={() => window.location.href = '/dashboard/projects-v2'}
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
          onClick={() => window.location.href = '/dashboard/projects-v2'}
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