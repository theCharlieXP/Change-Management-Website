'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteProject } from '@/lib/supabase'

interface DeleteProjectDialogProps {
  projectId: string
  projectTitle: string
}

export function DeleteProjectDialog({ projectId, projectTitle }: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProject(projectId)
      setOpen(false)
      router.push('/dashboard/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex flex-col items-start space-y-2">
        <h3 className="text-lg font-medium">Delete Project</h3>
        <p className="text-sm text-muted-foreground">
          Once deleted, all project data will be permanently removed and cannot be recovered.
        </p>
        <Button
          variant="destructive"
          onClick={() => setOpen(true)}
          className="mt-2"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Project
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <span className="font-medium">{projectTitle}</span>?
              </p>
              <p className="text-red-600">
                This action is irreversible. All project data, including notes, tasks, and saved insights will be permanently deleted.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 