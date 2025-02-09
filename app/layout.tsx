import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { ProfileCreator } from '@/components/auth/profile-creator'

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
      <body className={`${inter.className} min-h-screen bg-background antialiased`} suppressHydrationWarning>
        <ClerkProvider>
          <ProfileCreator />
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
} 