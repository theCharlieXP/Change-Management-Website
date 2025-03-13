import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "./ui/use-toast"
import { Insight } from "@/types/insights"
import { Project, ProjectStatus } from "@/types/projects"
import { Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'

interface SaveToProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insight: Insight & { notes?: string }
  isLoading: boolean
  isSummary?: boolean
}

interface ProjectData {
  id: string
  title: string
  description: string | null
  user_id: string
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export function SaveToProjectDialog({
  open,
  onOpenChange,
  insight,
  isLoading: initialLoading,
  isSummary = false
}: SaveToProjectDialogProps) {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset error when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoadingProjects(true)
      setError(null)
      console.log('Fetching projects for user:', userId)
      
      if (!userId) {
        console.error('No user ID available')
        setError('User not authenticated')
        setIsLoadingProjects(false)
        return
      }

      const response = await fetch(`/api/projects?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error(`Error fetching projects: ${response.statusText}`)
      }
      
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoadingProjects(false)
    }
  }, [userId])

  useEffect(() => {
    if (!open) return
    
    if (!isLoaded || !isSignedIn) {
      setError('Please sign in to save to a project')
      return
    }
    if (userId) {
      fetchProjects()
    }
  }, [open, isLoaded, isSignedIn, userId, fetchProjects])

  const handleSave = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project to save to",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const endpoint = isSummary 
        ? `/api/projects/${selectedProjectId}/summaries`
        : '/api/projects/insights'

      const payload = isSummary
        ? {
            title: insight.title,
            content: Array.isArray(insight.content) ? insight.content.join('\n\n') : insight.content,
            notes: insight.notes || null,
            focus_area: insight.focus_area
          }
        : {
            project_id: selectedProjectId,
            insight: {
              id: insight.id,
              title: insight.title,
              url: insight.url,
              summary: insight.summary,
              notes: insight.notes,
              focus_area: insight.focus_area
            }
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `Failed to save ${isSummary ? 'summary' : 'insight'}`)
      }

      toast({
        title: "Success",
        description: `${isSummary ? 'Summary' : 'Insight'} saved to project`
      })

      onOpenChange(false)
      setSelectedProjectId('')
    } catch (error) {
      console.error('Error saving:', error)
      setError(error instanceof Error ? error.message : 'Failed to save')
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = initialLoading || isLoadingProjects || !isLoaded

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save to Project</DialogTitle>
          <DialogDescription>
            Select a project to save this {isSummary ? 'summary' : 'insight'} to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {error ? (
            <div className="text-sm text-red-500 mb-4">
              {error}
            </div>
          ) : null}
          
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
            disabled={isLoading || isSaving}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                isLoading 
                  ? "Loading projects..." 
                  : projects.length === 0 
                  ? "No projects available" 
                  : "Select a project"
              } />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {projects.length === 0 && !isLoading && !error && (
            <p className="text-sm text-muted-foreground mt-2">
              No projects found. Create a project first to save insights.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedProjectId || isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 