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
    
    // Use direct browser navigation with a small delay to ensure the click is processed
    setTimeout(() => {
      // Go directly to the dashboard project details page which has a working data loader
      window.location.href = `/dashboard/projects/${projectId}`;
    }, 100);
  };
  
  return (
    <a 
      href={`/dashboard/projects/${projectId}`} 
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
} 