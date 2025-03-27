'use client'

import { ReactNode } from 'react'

interface FallbackProjectLinkProps {
  projectId: string;
  children: ReactNode;
  className?: string;
}

export function FallbackProjectLink({ projectId, children, className = '' }: FallbackProjectLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('FallbackProjectLink: Direct navigation to project details:', projectId);
    
    // Add a visible loading state
    const target = e.currentTarget as HTMLElement;
    const originalInnerHTML = target.innerHTML;
    target.innerHTML = '<div class="flex items-center justify-center"><div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div> Loading project...</div>';
    
    // Completely bypass router by directly setting location - this is more reliable
    // than router.push or history API methods
    try {
      // Get the fully qualified URL to the hybrid project page
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}/hybrid-project/${projectId}`;
      console.log('FallbackProjectLink: Navigating to full URL:', fullUrl);
      
      // Use direct window.location assignment for the most reliable navigation
      window.location.href = fullUrl;
    } catch (error) {
      console.error('FallbackProjectLink: Navigation error:', error);
      // Restore original content in case of error
      target.innerHTML = originalInnerHTML;
      alert('Failed to navigate to project. Please try again.');
    }
  };
  
  // Use a regular anchor tag with no dependencies on Next.js or React Router
  // This ensures the most basic and reliable navigation
  return (
    <a 
      href={`/hybrid-project/${projectId}`} 
      onClick={handleClick}
      className={className}
      data-project-id={projectId}
    >
      {children}
    </a>
  );
} 