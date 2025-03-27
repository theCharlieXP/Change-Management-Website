'use client'

import { ReactNode, useState } from 'react'

interface FallbackProjectLinkProps {
  projectId: string;
  children: ReactNode;
  className?: string;
}

export function FallbackProjectLink({ projectId, children, className = '' }: FallbackProjectLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Prevent double-clicks or navigation while already in progress
    if (isNavigating) {
      console.log('FallbackProjectLink: Navigation already in progress, ignoring click');
      return;
    }
    
    setIsNavigating(true);
    console.log('FallbackProjectLink: [NAVIGATION START] to project details:', projectId);
    
    // Add a visible loading state
    const target = e.currentTarget as HTMLElement;
    const originalInnerHTML = target.innerHTML;
    target.innerHTML = '<div class="flex items-center justify-center"><div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div> Loading project...</div>';
    
    // Log current page state
    console.log('FallbackProjectLink: Current page state before navigation:', {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      historyLength: history.length,
      referrer: document.referrer
    });
    
    try {
      // IMPORTANT: Use our new direct-project-view route instead of hybrid-project
      // This bypasses any route conflicts or redirects
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}/direct-project-view/${projectId}`;
      console.log('FallbackProjectLink: [NAVIGATION ATTEMPT] to full URL:', fullUrl);
      
      // Force a complete page reload to avoid any client-side routing issues
      window.location.href = fullUrl;
    } catch (error) {
      console.error('FallbackProjectLink: [NAVIGATION ERROR]', error);
      setNavigationError(error instanceof Error ? error.message : 'Unknown error');
      // Restore original content in case of error
      target.innerHTML = originalInnerHTML;
      setIsNavigating(false);
      alert('Failed to navigate to project. Please try again.');
    }
  };
  
  // Use a regular anchor tag with direct link (with no client-side routing)
  return (
    <a 
      href={`/direct-project-view/${projectId}`} 
      onClick={handleClick}
      className={className}
      data-project-id={projectId}
      data-is-navigating={isNavigating}
      data-navigation-error={navigationError}
      data-testid="fallback-project-link"
    >
      {children}
    </a>
  );
} 