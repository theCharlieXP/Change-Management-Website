import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

// Simple server component that redirects to the hybrid project page
export default async function ProjectRedirectPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId
  
  // Check auth
  const { userId } = await auth()
  
  // If not authenticated, redirect to sign in
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Redirect to the hybrid project page
  redirect(`/hybrid-project/${projectId}`)
} 