'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        variables: { colorPrimary: '#10b981' }
      }}
      afterSignInUrl="/dashboard/projects"
      afterSignUpUrl="/dashboard/projects"
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