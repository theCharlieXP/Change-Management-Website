'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface CreateProjectFormProps {
  onSubmit: (title: string) => Promise<void>
}

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onSubmit(title.trim())
      
      // Reset form
      setTitle('')
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