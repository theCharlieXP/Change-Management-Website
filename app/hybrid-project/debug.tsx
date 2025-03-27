'use client'

import { useEffect } from 'react'

export function HybridDebug() {
  useEffect(() => {
    console.log('========== HYBRID DEBUG START ==========');
    console.log('HybridDebug component mounted at ' + window.location.pathname);
    console.log('Document readyState:', document.readyState);
    console.log('Window history length:', history.length);
    
    // Log any components that might be interfering with navigation
    console.log('Checking for redirects or navigation issues');
    console.log('Location: ' + JSON.stringify({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href
    }));

    // Detect if this is a reload or a navigation
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('Navigation type:', navigationEntry ? navigationEntry.type : 'unknown');

    // Detect auth state
    const authToken = document.cookie.includes('__session');
    console.log('Auth token present in cookies:', authToken);
    
    // Create a MutationObserver to watch for DOM changes that might indicate a redirect
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log('DOM mutation detected - possible navigation/hydration reset');
        }
      }
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Report any URL changes
    const reportChange = () => {
      console.log('URL changed to ' + window.location.pathname);
    }
    
    window.addEventListener('popstate', reportChange);
    
    // Also patch history methods to track programmatic navigation
    const originalPushState = history.pushState;
    history.pushState = function(data: any, unused: string, url?: string | URL | null) {
      console.log('⚠️ pushState intercepted:', { 
        from: window.location.pathname,
        to: typeof url === 'string' ? url : url instanceof URL ? url.pathname : 'unknown'
      });
      const result = originalPushState.call(this, data, unused, url);
      console.log('pushState executed, URL now: ' + window.location.pathname);
      return result;
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function(data: any, unused: string, url?: string | URL | null) {
      console.log('⚠️ replaceState intercepted:', { 
        from: window.location.pathname,
        to: typeof url === 'string' ? url : url instanceof URL ? url.pathname : 'unknown'
      });
      const result = originalReplaceState.call(this, data, unused, url);
      console.log('replaceState executed, URL now: ' + window.location.pathname);
      return result;
    };

    // Also monitor all anchor clicks on the page
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        console.log('🔗 Link click detected:', {
          href: anchor.getAttribute('href'),
          target: anchor.getAttribute('target'),
          hasRouter: !!(anchor as any).__NEXT_ROUTER_BASEPATH,
          dataset: Object.keys(anchor.dataset),
        });
      }
    }, true); // Use capture phase to catch all clicks
    
    // Check if Next.js router is setup correctly
    console.log('Next Router enabled:', !!(window as any).__NEXT_DATA__);
    
    // Try to detect problematic global handlers
    const globalHandlers = {
      beforeunload: !!window.onbeforeunload,
      unload: !!window.onunload,
      popstate: !!window.onpopstate,
      pushstate: !!(window as any).onpushstate,  // Non-standard but sometimes used
    };
    console.log('Global handlers detected:', globalHandlers);
    
    console.log('========== HYBRID DEBUG END ==========');
    
    return () => {
      console.log('========== HYBRID DEBUG UNMOUNTING ==========');
      console.log('HybridDebug component unmounted from ' + window.location.pathname);
      console.log('Unmount reason: navigation or component removal');
      window.removeEventListener('popstate', reportChange);
      
      // Restore original methods
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      
      // Disconnect the observer
      observer.disconnect();
      console.log('========== HYBRID DEBUG UNMOUNTED ==========');
    }
  }, []);
  
  return null // This component doesn't render anything
} 