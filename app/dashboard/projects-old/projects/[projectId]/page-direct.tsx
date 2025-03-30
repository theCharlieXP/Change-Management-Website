// Server-side component for direct project access
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ClientPage from './page'

export default async function ProjectPageDirect({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId

  console.log('Server-side rendering project page for ID:', projectId)

  // Get authentication data
  const { userId } = await auth()
  
  if (!userId) {
    console.log('Unauthorized access to project details, redirecting to sign-in')
    redirect('/sign-in')
  }

  // Create a Supabase client with the service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials for server component')
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-red-700">Server Configuration Error</h2>
          <p className="text-red-600">
            The server is missing required configuration. Please try again later or contact support.
          </p>
          <Link href="/dashboard/projects" className="flex items-center mt-4 text-sm text-gray-600 hover:text-gray-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  // Create the Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  try {
    // Check if the project exists and is owned by the user
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (error || !project) {
      console.error('Project not found or not accessible:', error)
      return (
        <div className="container mx-auto py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
            <h2 className="text-lg font-semibold text-amber-700">Project Not Found</h2>
            <p className="text-amber-600">
              The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Link href="/dashboard/projects" className="flex items-center mt-4 text-sm text-gray-600 hover:text-gray-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </div>
        </div>
      )
    }

    // If we've reached here, the project exists and can be displayed
    console.log('Project verified on server, rendering client component')
    
    // Redirect to the client component
    return <ClientPage />
    
  } catch (error) {
    console.error('Error in server-side project verification:', error)
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-red-700">Error Loading Project</h2>
          <p className="text-red-600">
            An error occurred while trying to load the project. Please try again later.
          </p>
          <Link href="/dashboard/projects" className="flex items-center mt-4 text-sm text-gray-600 hover:text-gray-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }
} 