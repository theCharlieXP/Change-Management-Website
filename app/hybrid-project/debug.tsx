'use client'

import { useEffect } from 'react'

export function HybridDebug() {
  useEffect(() => {
    console.log('HybridDebug component mounted at ' + window.location.pathname)
    
    // Log any components that might be interfering with navigation
    console.log('Checking for redirects or navigation issues')
    console.log('Location: ' + JSON.stringify({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href
    }))
    
    // Report any URL changes
    const reportChange = () => {
      console.log('URL changed to ' + window.location.pathname)
    }
    
    window.addEventListener('popstate', reportChange)
    
    // Also patch history methods to track programmatic navigation
    const originalPushState = history.pushState;
    history.pushState = function(data: any, unused: string, url?: string | URL | null) {
      const result = originalPushState.call(this, data, unused, url);
      console.log('pushState called, URL now: ' + window.location.pathname);
      return result;
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function(data: any, unused: string, url?: string | URL | null) {
      const result = originalReplaceState.call(this, data, unused, url);
      console.log('replaceState called, URL now: ' + window.location.pathname);
      return result;
    };
    
    return () => {
      console.log('HybridDebug component unmounted from ' + window.location.pathname)
      window.removeEventListener('popstate', reportChange)
      
      // Restore original methods
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [])
  
  return null // This component doesn't render anything
} 