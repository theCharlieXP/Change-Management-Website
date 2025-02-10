'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateProjectForm } from './create-project-form'
import type { Project } from '@/types/projects'
import { useUser } from '@clerk/nextjs'
import { createProject } from '@/lib/supabase'

interface CreateProjectDialogProps {
  onProjectCreated?: (project: Project) => void
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const { user } = useUser()

  const handleProjectCreated = async (title: string, description: string = '') => {
    if (!user) return

    try {
      const newProject = await createProject(user.id, title, description)
      onProjectCreated?.(newProject)
      setOpen(false)
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <CreateProjectForm 
          onSubmit={handleProjectCreated}
        />
      </DialogContent>
    </Dialog>
  )
} 