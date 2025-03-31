import { Inter } from 'next/font/google'
import './globals.css'
import { ProfileCreator } from '@/components/auth/profile-creator'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from './providers'
import Script from 'next/script'
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
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}