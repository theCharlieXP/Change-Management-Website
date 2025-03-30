import { Inter } from 'next/font/google'
import './globals.css'
import { ProfileCreator } from '@/components/auth/profile-creator'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from './providers'
import Script from 'next/script'
import { ClerkProvider } from '@clerk/nextjs'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Change Management',
  description: 'Track and manage organizational changes effectively',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Using static rendering by default (new in Clerk v6)
    // If you need dynamic rendering for the entire app, add the 'dynamic' prop
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Canonical URL */}
          <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL || 'https://changeamigo.com'} />
          
          {/* Anti-redirect script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Run immediately
                  if (typeof window !== 'undefined') {
                    // Check if we're on a projects-v2 detail page
                    const isProjectV2Page = window.location.pathname.match(/^\\/dashboard\\/projects-v2\\/[^\\/]+$/);
                    if (isProjectV2Page) {
                      console.log('Anti-redirect script activated for projects-v2 detail page');
                      
                      // Store the current pathname
                      const currentPath = window.location.pathname;
                      const projectId = currentPath.split('/').pop();
                      
                      // Override navigation methods
                      const originalPushState = history.pushState;
                      const originalReplaceState = history.replaceState;
                      const originalAssign = window.location.assign;
                      const originalReplace = window.location.replace;
                      
                      // Intercept pushState
                      history.pushState = function() {
                        if (arguments[2] === '/' || arguments[2] === '/dashboard') {
                          console.log('PREVENTED pushState redirect to root');
                          return originalPushState.call(this, arguments[0], arguments[1], currentPath);
                        }
                        return originalPushState.apply(this, arguments);
                      };
                      
                      // Intercept replaceState
                      history.replaceState = function() {
                        if (arguments[2] === '/' || arguments[2] === '/dashboard') {
                          console.log('PREVENTED replaceState redirect to root');
                          return originalReplaceState.call(this, arguments[0], arguments[1], currentPath);
                        }
                        return originalReplaceState.apply(this, arguments);
                      };
                      
                      // Intercept window.location.assign
                      window.location.assign = function(url) {
                        if (url === '/' || url === '/dashboard') {
                          console.log('PREVENTED location.assign redirect to root');
                          return;
                        }
                        return originalAssign.call(this, url);
                      };
                      
                      // Intercept window.location.replace
                      window.location.replace = function(url) {
                        if (url === '/' || url === '/dashboard') {
                          console.log('PREVENTED location.replace redirect to root');
                          return;
                        }
                        return originalReplace.call(this, url);
                      };
                      
                      // Periodically check if we're still on the right page
                      setInterval(() => {
                        if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
                          console.log('Anti-redirect script: Detected redirect to root, redirecting back');
                          window.location.href = currentPath;
                        }
                      }, 100);
                      
                      // Additional anti-clerk redirect code - more aggressive
                      // This will run after the page has loaded
                      window.addEventListener('DOMContentLoaded', () => {
                        console.log('DOM loaded, setting up Clerk redirect prevention');
                        
                        // Find and patch Clerk's redirect functions
                        setTimeout(() => {
                          try {
                            // Look through all window properties for any Clerk-related functions
                            Object.keys(window).forEach(key => {
                              if (
                                key.includes('Clerk') || 
                                (typeof window[key] === 'object' && window[key] && window[key].__clerk)
                              ) {
                                console.log('Found potential Clerk object:', key);
                                
                                // Try to patch Clerk redirect
                                try {
                                  const clerkObj = window[key];
                                  if (clerkObj && clerkObj.navigate) {
                                    const originalNavigate = clerkObj.navigate;
                                    clerkObj.navigate = function(to) {
                                      console.log('Clerk navigate intercepted:', to);
                                      if (to === '/' || to === '/dashboard') {
                                        console.log('PREVENTED Clerk redirect to root');
                                        return;
                                      }
                                      return originalNavigate.apply(this, arguments);
                                    };
                                    console.log('Patched Clerk navigate function');
                                  }
                                } catch (e) {
                                  console.error('Error patching Clerk object:', e);
                                }
                              }
                            });
                          } catch (e) {
                            console.error('Error in Clerk patching code:', e);
                          }
                        }, 500);
                      });
                    }
                  }
                })();
              `
            }}
          />
          
          {/* Goat Counter Analytics */}
          <script
            data-goatcounter="https://changeamigo.goatcounter.com/count"
            async
            src="https://gc.zgo.at/count.js"
            dangerouslySetInnerHTML={{ __html: '' }}
          />
        </head>
        <body className={`${inter.className} min-h-screen bg-background antialiased`} suppressHydrationWarning>
          <Providers>
            <ProfileCreator />
            {/* Script to log page visits for debugging */}
            <script 
              dangerouslySetInnerHTML={{ 
                __html: `
                  console.log('Page loaded: ' + window.location.pathname + window.location.search);
                  
                  // Debug navigation
                  const originalPushState = history.pushState;
                  history.pushState = function() {
                    console.log('Navigation detected: pushState to', arguments[2]);
                    return originalPushState.apply(this, arguments);
                  };
                  
                  const originalReplaceState = history.replaceState;
                  history.replaceState = function() {
                    console.log('Navigation detected: replaceState to', arguments[2]);
                    return originalReplaceState.apply(this, arguments);
                  };
                  
                  window.addEventListener('popstate', function() {
                    console.log('Navigation detected: popstate to', window.location.pathname);
                  });
                `
              }}
            />
            {children}
            <CookieConsent />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}