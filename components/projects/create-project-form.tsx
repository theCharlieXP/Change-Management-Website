'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/types/projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface CreateProjectFormProps {
  onSuccess?: () => void
  onProjectCreated?: (project: Project) => void
}

export function CreateProjectForm({ onSuccess, onProjectCreated }: CreateProjectFormProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create a mock project
      const newProject: Project = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: '', // Empty description by default
        status: 'planning',
        user_id: '1', // Mock user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Call onProjectCreated callback if provided
      onProjectCreated?.(newProject)
      
      // Call onSuccess callback if provided
      onSuccess?.()

      // Navigate to the new project
      router.push(`/dashboard/projects/${newProject.id}`)
      router.refresh()
    } catch (error) {
      console.error('Project creation error:', error)
      setError('Failed to create project. Please try again.')
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
          maxLength={40}
        />
        <p className="text-xs text-muted-foreground">
          {title.length}/40 characters
        </p>
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