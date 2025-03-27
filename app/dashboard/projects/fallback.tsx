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
    
    // Completely bypass router by directly setting location - this is more reliable
    // than router.push or history API methods
    try {
      // Get the fully qualified URL to the hybrid project page
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}/hybrid-project/${projectId}`;
      console.log('FallbackProjectLink: [NAVIGATION ATTEMPT] to full URL:', fullUrl);
      
      // Set up monitoring to detect if navigation fails
      const navigationTimeout = setTimeout(() => {
        console.error('FallbackProjectLink: [NAVIGATION TIMEOUT] Navigation did not complete within 5 seconds');
        setNavigationError('Navigation timeout');
        
        // Only restore the original content if we're still on the same page
        if (window.location.pathname !== `/hybrid-project/${projectId}`) {
          setIsNavigating(false);
          target.innerHTML = originalInnerHTML;
        }
      }, 5000);
      
      // Create a one-time listener to detect page unload
      const unloadListener = () => {
        console.log('FallbackProjectLink: [NAVIGATION PROGRESS] Page unload detected');
        clearTimeout(navigationTimeout);
        window.removeEventListener('beforeunload', unloadListener);
      };
      window.addEventListener('beforeunload', unloadListener, { once: true });
      
      // Add a listener for the load event in case we stay on the same page
      const loadListener = () => {
        console.log('FallbackProjectLink: [NAVIGATION COMPLETE] Page load event fired');
        clearTimeout(navigationTimeout);
        window.removeEventListener('load', loadListener);
      };
      window.addEventListener('load', loadListener, { once: true });
      
      // First, try to use a fetch request to preflight the URL to see if it works
      fetch(fullUrl, { method: 'HEAD', credentials: 'include' })
        .then(response => {
          console.log('FallbackProjectLink: [PREFLIGHT CHECK]', { 
            status: response.status,
            ok: response.ok
          });
          
          // Now perform the actual navigation
          console.log('FallbackProjectLink: [EXECUTING NAVIGATION] Assigning to window.location');
          
          // Force a full page navigation, not a client-side route change
          window.location.href = fullUrl;
        })
        .catch(error => {
          console.error('FallbackProjectLink: [PREFLIGHT ERROR]', error);
          // Still try the navigation even if preflight fails
          window.location.href = fullUrl;
        });
    } catch (error) {
      console.error('FallbackProjectLink: [NAVIGATION ERROR]', error);
      setNavigationError(error instanceof Error ? error.message : 'Unknown error');
      // Restore original content in case of error
      target.innerHTML = originalInnerHTML;
      setIsNavigating(false);
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
      data-is-navigating={isNavigating}
      data-navigation-error={navigationError}
      data-testid="fallback-project-link"
    >
      {children}
    </a>
  );
} 