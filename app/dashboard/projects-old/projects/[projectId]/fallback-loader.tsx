'use client'

import { useEffect, useState } from 'react'

export function FallbackLoader({ projectId }: { projectId: string }) {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  
  // Load data using basic fetch in a useEffect
  useEffect(() => {
    console.log('FallbackLoader mounted for project:', projectId);
    setIsReady(true);
    
    async function loadData() {
      try {
        // Get project data
        console.log('FallbackLoader fetching project data');
        const projectRes = await fetch(`/api/projects/${projectId}`);
        if (!projectRes.ok) {
          throw new Error(`Failed to load project: ${projectRes.status}`);
        }
        const project = await projectRes.json();
        
        // Get tasks
        const tasksRes = await fetch(`/api/projects/${projectId}/tasks`);
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        
        // Get notes
        const notesRes = await fetch(`/api/projects/${projectId}/notes`);
        const notes = notesRes.ok ? await notesRes.json() : [];
        
        // Set all data
        setProjectData({ project, tasks, notes });
        setLoading(false);
      } catch (err) {
        console.error('Error in FallbackLoader:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
        setLoading(false);
      }
    }
    
    loadData();
    
    // Set up a warning if we stay on the page too long
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('FallbackLoader still loading after 10 seconds');
      }
    }, 10000);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [projectId]);
  
  // If not ready yet, don't render anything
  if (!isReady) return null;
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', padding: '20px', marginBottom: '20px', backgroundColor: '#f0f9ff', borderRadius: '4px', maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0284c7' }}>Loading Project...</h3>
          <div style={{ width: '50px', height: '50px', margin: '0 auto', border: '5px solid #f3f3f3', borderTop: '5px solid #0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
          <p style={{ marginTop: '15px', fontSize: '14px', color: '#64748b' }}>Please wait while we load your project data</p>
        </div>
      </div>
    );
  }
  
  // If error, show error message
  if (error || !projectData || !projectData.project) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Error Loading Project</h3>
          <p style={{ margin: '0 0 15px 0' }}>{error || 'Project not found'}</p>
          <a 
            href="/dashboard/projects"
            style={{ 
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            Back to Projects
          </a>
        </div>
      </div>
    );
  }
  
  // If we have data, show the project
  const { project, tasks, notes } = projectData;
  
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap', 
        gap: '10px'
      }}>
        <a 
          href="/dashboard/projects" 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
            {project.title}
          </h1>
          <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontSize: '12px', 
              padding: '2px 8px', 
              borderRadius: '9999px', 
              backgroundColor: '#bfdbfe', 
              color: '#1e40af'
            }}>
              {project.status || 'Planning'}
            </span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      
      {project.description && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          marginBottom: '20px' 
        }}>
          <p style={{ margin: '0', color: '#4b5563' }}>{project.description}</p>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Tasks */}
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '0', marginBottom: '15px' }}>
            Tasks
          </h2>
          
          {tasks && tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.map((task: any) => (
                <div key={task.id} style={{ display: 'flex', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
                  <input 
                    type="checkbox" 
                    checked={task.status === 'completed'} 
                    readOnly 
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '500' }}>{task.title}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Added {new Date(task.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
              No tasks yet
            </p>
          )}
        </div>
        
        {/* Notes */}
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '0', marginBottom: '15px' }}>
            Notes
          </h2>
          
          {notes && notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {notes.map((note: any) => (
                <div key={note.id} style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                  <p style={{ margin: '0 0 8px 0', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Added {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
              No notes yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 