'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Determine if the current route is a project detail page
  const isProjectDetailPage = (
    (pathname?.includes('/dashboard/projects/') && pathname?.split('/').length > 3) ||
    /\/dashboard\/projects\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(pathname || '') ||
    /\/dashboard\/projects\/[^/]+$/.test(pathname || '')
  );
    
  // Add client-side protection against unwanted redirects
  useEffect(() => {
    if (isProjectDetailPage && typeof window !== 'undefined') {
      console.log('Providers: Adding protection for project detail page:', pathname);
      const projectId = pathname?.split('/').pop();
      const projectPath = `/dashboard/projects/${projectId}`;
      
      // Block all redirects to unwanted locations
      const blockUnwantedRedirects = () => {
        try {
          // Override native navigation methods
          const originalWindowOpen = window.open;
          window.open = function(url, ...args) {
            if (url === '/' || url === '/dashboard') {
              console.log('Providers: Blocked window.open to:', url);
              return null;
            }
            return originalWindowOpen.call(this, url, ...args);
          };
          
          // Intercept all anchor clicks
          document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            if (anchor && (anchor.href.endsWith('/') || anchor.href.endsWith('/dashboard'))) {
              console.log('Providers: Blocked click on link to root');
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }, true);
        } catch (e) {
          console.error('Error setting up redirect blockers:', e);
        }
      };
      
      // Run immediately
      blockUnwantedRedirects();
      
      // Intercept location changes
      const locationProtectionInterval = setInterval(() => {
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '/dashboard') {
          console.log('Providers: Prevented redirect from project page to', currentPath);
          window.location.replace(projectPath);
        }
      }, 50);
      
      return () => {
        clearInterval(locationProtectionInterval);
      };
    }
  }, [isProjectDetailPage, pathname]);
  
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        variables: { colorPrimary: '#10b981' }
      }}
      signInFallbackRedirectUrl="/dashboard/projects"
      signUpFallbackRedirectUrl="/dashboard/projects"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ClerkProvider>
  )
} 