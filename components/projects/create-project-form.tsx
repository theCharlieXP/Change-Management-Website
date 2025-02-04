'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useAuth } from '@clerk/nextjs'
import type { ProjectStatus } from '@/types/projects'
import { useSupabaseClient } from '@/lib/supabase/client'

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
  const supabase = useSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to create a project')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get the JWT to extract the user_id claim
      const token = await getToken({ template: 'supabase' })
      if (!token) {
        throw new Error('Failed to get authentication token')
      }

      // Decode the JWT to get the user_id claim
      const [, payloadBase64] = token.split('.')
      const payload = JSON.parse(atob(payloadBase64))
      
      // Log the full JWT payload for debugging
      console.log('Project Creation - JWT Claims:', JSON.stringify(payload, null, 2))

      // Create a new UUID for the project
      const projectId = crypto.randomUUID()
      
      // Prepare project data using the user_id from JWT
      const projectData = {
        id: projectId,
        title: title.trim(),
        description: '',
        status: 'planning' as ProjectStatus,
        user_id: payload.sub || payload.user_id, // Try both possible claims
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating project with data:', JSON.stringify({
        ...projectData,
        jwt_claims: {
          sub: payload.sub,
          user_id: payload.user_id,
          role: payload.role
        },
        clerk_user_id: user.id
      }, null, 2))

      // Create the project
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id')
        .single()

      if (insertError) {
        console.error('Insert error:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })

        // Try a test query to verify authentication
        const { data: testData, error: testError } = await supabase
          .from('projects')
          .select('count')
          .limit(1)
          .single()

        if (testError) {
          console.error('Auth test after insert error:', {
            code: testError.code,
            message: testError.message,
            details: testError.details,
            hint: testError.hint
          })
        } else {
          console.log('Auth test after insert error succeeded:', testData)
        }

        throw new Error(`Failed to create project: ${insertError.message} (${insertError.code})`)
      }

      if (!data?.id) {
        throw new Error('Failed to create project: No ID returned')
      }

      // Call onSuccess callback if provided
      onSuccess?.()

      try {
        // Force a router cache refresh
        router.refresh()

        // Navigate to the new project
        router.push(`/dashboard/projects/${projectId}`)
      } catch (navigationError) {
        console.error('Navigation error:', navigationError)
        // If navigation fails, try a hard redirect
        window.location.href = `/dashboard/projects/${projectId}`
      }
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