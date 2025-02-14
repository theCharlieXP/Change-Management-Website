'use client'

import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import type { ProjectNote } from '@/types/projects'

interface ProjectNotesProps {
  notes: ProjectNote[]
  projectId: string
  onAdd: (note: { content: string }) => Promise<ProjectNote>
  onUpdate: (id: string, note: { content: string }) => Promise<ProjectNote>
  onDelete: (id: string) => Promise<void>
}

export function ProjectNotes({ notes, projectId, onAdd, onUpdate, onDelete }: ProjectNotesProps) {
  const [content, setContent] = useState('')
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load the most recent note when the component mounts or notes change
  useEffect(() => {
    if (notes.length > 0) {
      // Only update content if it hasn't been initialized or if we have a different note
      if (!isInitialized || notes[0].id !== currentNoteId) {
        const latestNote = notes[0] // Notes are ordered by created_at desc
        setContent(latestNote.content)
        setCurrentNoteId(latestNote.id)
        setIsInitialized(true)
      }
    } else if (isInitialized) {
      // Clear content if there are no notes and we were previously initialized
      setContent('')
      setCurrentNoteId(null)
    }
  }, [notes, isInitialized, currentNoteId])

  const saveNote = useDebouncedCallback(async (newContent: string) => {
    if (newContent.trim() === '') return
    
    try {
      setIsSaving(true)
      if (currentNoteId) {
        const updatedNote = await onUpdate(currentNoteId, { content: newContent })
        setCurrentNoteId(updatedNote.id)
      } else {
        const newNote = await onAdd({ content: newContent })
        setCurrentNoteId(newNote.id)
      }
    } catch (error) {
      console.error('Failed to save note:', error)
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }, 1000)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    saveNote(newContent)
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={handleChange}
        placeholder="Write your notes here..."
        className="min-h-[400px] resize-none"
      />
      <div className="text-xs text-muted-foreground">
        {isSaving ? 'Saving...' : 'All changes saved'}
      </div>
    </div>
  )
} 