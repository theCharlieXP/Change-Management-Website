'use client'

import { useEffect } from 'react'

export default function CommunicationsAmigoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use effect to add and remove a class to the body to prevent dashboard layout
  useEffect(() => {
    // Add a class to the body to override dashboard styles
    document.body.classList.add('communications-amigo-page')
    
    // Clean up when component unmounts
    return () => {
      document.body.classList.remove('communications-amigo-page')
    }
  }, [])
  
  return (
    <div className="w-full h-screen max-w-full overflow-x-hidden">
      {children}
    </div>
  )
} 