import { Inter } from 'next/font/google'
import './globals.css'
import { ProfileCreator } from '@/components/auth/profile-creator'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from './providers'
import Script from 'next/script'

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
        {/* Goat Counter Analytics */}
        <Script
          id="goatcounter-script"
          strategy="afterInteractive"
          src="https://gc.zgo.at/count.js"
          data-goatcounter="https://[YOUR_CODE].goatcounter.com/count"
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-background antialiased`} suppressHydrationWarning>
        <Providers>
          <ProfileCreator />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
} 