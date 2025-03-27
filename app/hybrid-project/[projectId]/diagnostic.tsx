'use client'

import { useEffect, useState } from 'react'

// This component is for debugging only and should be removed in production
export function NavigationDiagnostic({ projectId }: { projectId: string }) {
  const [pageLoadTime] = useState<string>(new Date().toISOString());
  const [navigationHistory, setNavigationHistory] = useState<Array<{
    event: string;
    url: string;
    timestamp: string;
  }>>([]);
  
  useEffect(() => {
    console.log('🔍 NavigationDiagnostic mounted for project:', projectId);
    
    // Record initial state
    const initialLoad = {
      event: 'initial',
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    setNavigationHistory([initialLoad]);
    
    // Record DOM content loaded
    const recordDOMContentLoaded = () => {
      const event = {
        event: 'DOMContentLoaded',
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      setNavigationHistory(prev => [...prev, event]);
    };
    
    // Record page fully loaded
    const recordLoad = () => {
      const event = {
        event: 'load',
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      setNavigationHistory(prev => [...prev, event]);
    };
    
    // Record navigation events
    const recordPushState = function(data: any, title: string, url?: string | URL | null) {
      const event = {
        event: 'pushState',
        url: url?.toString() || window.location.href,
        timestamp: new Date().toISOString()
      };
      setNavigationHistory(prev => [...prev, event]);
    };
    
    const recordReplaceState = function(data: any, title: string, url?: string | URL | null) {
      const event = {
        event: 'replaceState',
        url: url?.toString() || window.location.href,
        timestamp: new Date().toISOString()
      };
      setNavigationHistory(prev => [...prev, event]);
    };
    
    const recordPopState = () => {
      const event = {
        event: 'popState',
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      setNavigationHistory(prev => [...prev, event]);
    };
    
    // Create a periodic check for unexpected location changes
    const initialPath = window.location.pathname;
    const checkForLocationChanges = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== initialPath) {
        const event = {
          event: 'locationChange',
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
        setNavigationHistory(prev => [...prev, event]);
        console.warn('NavigationDiagnostic: Location changed without history event!', {
          from: initialPath,
          to: currentPath,
        });
        
        // Clear the interval if we detect a location change
        clearInterval(checkForLocationChanges);
      }
    }, 100);
    
    // Save original methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Override history methods to track navigation
    history.pushState = function() {
      recordPushState.apply(this, arguments as any);
      return originalPushState.apply(this, arguments as any);
    };
    
    history.replaceState = function() {
      recordReplaceState.apply(this, arguments as any);
      return originalReplaceState.apply(this, arguments as any);
    };
    
    // Attach event listeners
    window.addEventListener('DOMContentLoaded', recordDOMContentLoaded);
    window.addEventListener('load', recordLoad);
    window.addEventListener('popstate', recordPopState);
    
    // Record a heartbeat to ensure the component is still alive
    const heartbeatInterval = setInterval(() => {
      const event = {
        event: 'heartbeat',
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      setNavigationHistory(prev => [...prev, event]);
    }, 2000);
    
    // Debug any routing issues with Next.js
    let lastPath = window.location.pathname;
    const routingCheck = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        console.log('NavigationDiagnostic: Path changed without standard events:', {
          from: lastPath,
          to: currentPath,
          timestamp: new Date().toISOString()
        });
        lastPath = currentPath;
      }
      
      // Try to detect if we ended up at / when we should be at /hybrid-project/{id}
      if (currentPath === '/' && lastPath.startsWith('/hybrid-project/')) {
        console.error('NavigationDiagnostic: DETECTED INCORRECT REDIRECT TO ROOT!', {
          intendedPath: lastPath,
          currentPath: '/',
          timestamp: new Date().toISOString()
        });
      }
    }, 200);
    
    // Clean up
    return () => {
      console.log('NavigationDiagnostic unmounted, final navigation history:', navigationHistory);
      window.removeEventListener('DOMContentLoaded', recordDOMContentLoaded);
      window.removeEventListener('load', recordLoad);
      window.removeEventListener('popstate', recordPopState);
      
      // Restore original methods
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      
      // Clear intervals
      clearInterval(heartbeatInterval);
      clearInterval(checkForLocationChanges);
      clearInterval(routingCheck);
    };
  }, [projectId]);

  // Render diagnostic information that can be viewed in the DOM
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      width: '1px', 
      height: '1px', 
      overflow: 'hidden',
      opacity: 0.01
    }} 
    className="navigation-diagnostic"
    data-project-id={projectId}
    data-page-load-time={pageLoadTime}
    data-navigation-events={navigationHistory.length}
    data-current-url={typeof window !== 'undefined' ? window.location.href : 'server'}
    >
      {/* Events as data attributes for potential inspection */}
      {navigationHistory.map((event, index) => (
        <span 
          key={index}
          data-event={event.event}
          data-url={event.url}
          data-timestamp={event.timestamp}
        />
      ))}
    </div>
  );
} 