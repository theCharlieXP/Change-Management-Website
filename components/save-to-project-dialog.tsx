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
import { useState } from "react"
import { toast } from "./ui/use-toast"
import { Insight } from "@/types/insight"
import { Project } from "@/types/project"
import { fetchWithAuth } from "@/lib/utils"

interface SaveToProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insight: Insight
  projects: Project[]
}

export function SaveToProjectDialog({
  open,
  onOpenChange,
  insight,
  projects
}: SaveToProjectDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetchWithAuth('/api/projects/insights', {
        method: 'POST',
        body: JSON.stringify({
          project_id: selectedProjectId,
          insight_id: insight.id,
          additional_notes: insight.notes || null
        })
      })

      if (!response) {
        throw new Error('Failed to save insight')
      }

      toast({
        title: "Success",
        description: "Insight saved to project",
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving insight:', error)
      toast({
        title: "Error",
        description: "Failed to save insight to project",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save to Project</DialogTitle>
          <DialogDescription>
            Select a project to save this insight to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 