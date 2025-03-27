'use client'

import { useEffect } from 'react'

// This component will debug Next.js router and transitions
export function TransitionDebug() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('TransitionDebug mounted');
    
    // Create a sentinel object on the window
    const w = window as any;
    w.__nextTransitions = w.__nextTransitions || {
      transitionCount: 0,
      lastTransition: null
    };
    
    // Add entry point marker
    const transitionId = Date.now();
    w.__nextTransitions.transitionCount++;
    w.__nextTransitions.lastTransition = {
      id: transitionId,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[Navigation ${transitionId}] Page mounted at: ${window.location.pathname}`);
    
    // Monitor for Next.js router API if available
    const checkForRouter = () => {
      // Check for Next.js router globals
      const nextData = w.__NEXT_DATA__;
      if (nextData) {
        console.log(`[Navigation ${transitionId}] Next.js data found:`, {
          page: nextData.page,
          buildId: nextData.buildId?.slice(0, 8) + '...',
          assetPrefix: nextData.assetPrefix || '(none)',
          props: Object.keys(nextData.props || {})
        });
      }
    };
    
    // Check immediately and after a short delay
    checkForRouter();
    setTimeout(checkForRouter, 100);
    
    // Monitor document readyState changes
    const logReadyState = () => {
      console.log(`[Navigation ${transitionId}] Document ready state: ${document.readyState}`);
    };
    
    // Log current state and attach listener
    logReadyState();
    document.addEventListener('readystatechange', logReadyState);
    
    // Track when component is unmounted (navigation away)
    return () => {
      document.removeEventListener('readystatechange', logReadyState);
      console.log(`[Navigation ${transitionId}] Component unmounting from: ${window.location.pathname}`);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 