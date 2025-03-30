'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Determine if the current route is a project detail page
  const isProjectDetailPage = pathname?.includes('/dashboard/projects/') && 
    pathname?.split('/').length > 3;
    
  // Add client-side protection against unwanted redirects
  useEffect(() => {
    if (isProjectDetailPage && typeof window !== 'undefined') {
      console.log('Providers: Adding protection for project detail page');
      const projectId = pathname?.split('/').pop();
      const projectPath = `/dashboard/projects/${projectId}`;
      
      // Intercept location changes
      const locationProtectionInterval = setInterval(() => {
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '/dashboard') {
          console.log('Providers: Prevented redirect from project page to', currentPath);
          window.location.replace(projectPath);
        }
      }, 100);
      
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
      afterSignInUrl="/dashboard/projects"
      afterSignUpUrl="/dashboard/projects"
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