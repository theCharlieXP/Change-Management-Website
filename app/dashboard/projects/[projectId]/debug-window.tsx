'use client'

import { useEffect, useState } from 'react'

// Style for debugging overlay
const OVERLAY_STYLE = {
  position: 'fixed',
  top: '10px',
  right: '10px',
  width: '400px',
  maxHeight: '80vh',
  overflowY: 'auto',
  padding: '15px',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: '#00ff00',
  fontFamily: 'monospace',
  fontSize: '12px',
  zIndex: 10000,
  borderRadius: '5px',
  border: '1px solid #444',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
} as const;

export function DebugWindow() {
  const [logs, setLogs] = useState<string[]>([]);
  const [show, setShow] = useState(true);
  const [documentState, setDocumentState] = useState({
    readyState: typeof document !== 'undefined' ? document.readyState : 'unknown',
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    href: typeof window !== 'undefined' ? window.location.href : 'unknown',
  });

  useEffect(() => {
    function addLog(message: string) {
      const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
      setLogs((prev) => [...prev, `[${timestamp}] ${message}`].slice(-50));
    }

    addLog(`DEBUG WINDOW MOUNTED - Path: ${window.location.pathname}`);

    // Check document state
    const updateDocState = () => {
      setDocumentState({
        readyState: document.readyState,
        pathname: window.location.pathname,
        href: window.location.href,
      });
    };

    updateDocState();
    document.addEventListener('readystatechange', updateDocState);

    // Override history methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      const [state, title, url] = args;
      addLog(`PUSHSTATE → ${url}`);
      return originalPushState.apply(this, args);
    };

    history.replaceState = function(...args) {
      const [state, title, url] = args;
      addLog(`REPLACESTATE → ${url}`);
      return originalReplaceState.apply(this, args);
    };

    // Override location.href setter
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
    if (originalLocationDescriptor && originalLocationDescriptor.set) {
      Object.defineProperty(window.Location.prototype, 'href', {
        set: function(url) {
          addLog(`LOCATION.HREF SET → ${url}`);
          if (originalLocationDescriptor.set) {
            return originalLocationDescriptor.set.call(this, url);
          }
          return undefined;
        },
        get: originalLocationDescriptor.get,
        configurable: true
      });
    }

    // Track navigation events
    const handlePopState = () => {
      addLog(`POPSTATE → ${window.location.pathname}`);
      updateDocState();
    };

    const handleBeforeUnload = () => {
      addLog(`BEFOREUNLOAD`);
    };

    // Monitor for window focus changes
    const handleVisibilityChange = () => {
      addLog(`VISIBILITY: ${document.visibilityState}`);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add DOM mutation observer to detect Next.js page changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const nextDataNode = document.getElementById('__NEXT_DATA__');
          if (nextDataNode) {
            try {
              const nextData = JSON.parse(nextDataNode.textContent || '{}');
              if (nextData.page !== window.location.pathname) {
                addLog(`NEXTJS PAGE CHANGE: ${nextData.page}`);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, { 
      childList: true, 
      subtree: true 
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('readystatechange', updateDocState);
      
      // Restore original methods
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      if (originalLocationDescriptor) {
        Object.defineProperty(window.Location.prototype, 'href', originalLocationDescriptor);
      }
      
      observer.disconnect();
    };
  }, []);

  if (!show) return null;

  return (
    <div style={OVERLAY_STYLE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#fff' }}>Debug Window</h3>
        <button 
          onClick={() => setShow(false)}
          style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
      
      <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <div><strong>ReadyState:</strong> {documentState.readyState}</div>
        <div><strong>Pathname:</strong> {documentState.pathname}</div>
        <div><strong>Href:</strong> {documentState.href}</div>
      </div>
      
      <div>
        {logs.map((log, i) => (
          <div key={i} style={{ borderBottom: '1px solid #333', padding: '3px 0' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
} 