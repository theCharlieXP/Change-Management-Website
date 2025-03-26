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
    console.log('FallbackProjectLink: Direct navigation to project:', projectId);
    
    // Use direct browser navigation to hybrid project page
    window.location.href = `/hybrid-project/${projectId}`;
  };
  
  return (
    <a 
      href={`/hybrid-project/${projectId}`} 
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
} 