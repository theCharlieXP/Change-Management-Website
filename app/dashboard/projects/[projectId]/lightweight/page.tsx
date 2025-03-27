'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function LightweightTestPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId
  
  useEffect(() => {
    console.log('Lightweight test page mounted. Project ID:', projectId);
    
    // Add a sentinel value to detect if this component rendered
    if (typeof window !== 'undefined') {
      (window as any).__LIGHTWEIGHT_PAGE_LOADED = true;
    }
  }, [projectId]);
  
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        marginBottom: '20px'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c4a6e', marginTop: 0 }}>
          Lightweight Test Page
        </h1>
        <p style={{ marginBottom: '0' }}>
          This is a simple page that doesn't have any complex loading or rendering logic.
          Project ID: <strong>{projectId}</strong>
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Link 
          href={`/dashboard/projects/${projectId}`}
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#0ea5e9',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none'
          }}
        >
          Go to Full Project Page
        </Link>
        
        <Link 
          href="/dashboard/projects"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            borderRadius: '4px',
            textDecoration: 'none'
          }}
        >
          Back to Projects List
        </Link>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '0' }}>Technical Details</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Page rendered at: {new Date().toISOString()}</li>
          <li>Project ID from route: {projectId}</li>
          <li>Page URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</li>
          <li>User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}</li>
        </ul>
      </div>
    </div>
  )
} 