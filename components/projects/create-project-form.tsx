'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useAuth } from '@clerk/nextjs'
import type { ProjectStatus } from '@/types/projects'
import { createBrowserClient } from '@supabase/ssr'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export function CreateProjectForm({ onSuccess }: { onSuccess?: () => void }) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { user } = useUser()
  const { getToken } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to create a project')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Current user details:', {
        id: user.id,
        primaryEmailAddress: user.primaryEmailAddress?.emailAddress,
        createdAt: user.createdAt
      })

      // Get the Supabase token from Clerk
      const token = await getToken({ template: 'supabase' })
      
      if (!token) {
        throw new Error('Failed to get authentication token')
      }

      // Decode and log JWT payload for debugging
      let decodedPayload
      try {
        const [header, payload, signature] = token.split('.')
        decodedPayload = JSON.parse(atob(payload))
        console.log('JWT payload:', {
          sub: decodedPayload.sub,
          role: decodedPayload.role,
          email: decodedPayload.email,
          raw: decodedPayload
        })
      } catch (e) {
        console.error('Error decoding JWT:', e)
        throw new Error('Failed to decode JWT token')
      }

      // Create a Supabase client with the JWT token
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Test basic connection without auth
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('count')
        .limit(1)

      console.log('Connection test:', { testData, testError })

      if (testError) {
        throw new Error(`Connection test failed: ${testError.message}`)
      }

      // Create a new UUID for the project
      const projectId = crypto.randomUUID()
      
      // Prepare project data
      const projectData = {
        id: projectId,
        title: title.trim(),
        description: '',
        status: 'planning' as ProjectStatus,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Attempting to create project with data:', {
        projectData,
        token: token.substring(0, 20) + '...'
      })

      // Create the project
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id')
        .single()

      if (insertError) {
        console.error('Insert error:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          status: insertError.status
        })
        throw new Error(`Insert failed: ${insertError.message} (${insertError.code})`)
      }

      if (!data?.id) {
        throw new Error('Failed to create project: No ID returned')
      }

      console.log('Project created successfully:', data)

      // Call onSuccess callback if provided
      onSuccess?.()

      // Redirect to the new project's page
      router.push(`/dashboard/projects/${projectId}`)
      router.refresh()
    } catch (error) {
      console.error('Project creation error:', error)
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create project. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Project Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter project name"
          required
          disabled={loading}
          autoFocus
          minLength={1}
          maxLength={100}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Project...
          </>
        ) : (
          'Create Project'
        )}
      </Button>
    </form>
  )
} 