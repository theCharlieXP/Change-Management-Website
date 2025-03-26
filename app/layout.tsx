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