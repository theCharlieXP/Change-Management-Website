'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectTask, TaskStatus } from '@/types/projects'

interface TaskItemProps {
  task: ProjectTask
  onEdit: (task: ProjectTask) => void
  onDelete: (task: ProjectTask) => void
  getStatusBadgeColor: (status: TaskStatus) => string
  formatDate: (date: string | null) => string | null
  deletingId: string | null
}

const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800 border-red-200' }
]

export function TaskItem({ 
  task, 
  onEdit, 
  onDelete, 
  getStatusBadgeColor, 
  formatDate, 
  deletingId 
}: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-4 rounded-lg border border-border hover:border-border/80 hover:bg-muted/50 transition-colors",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium text-base truncate">{task.title}</h4>
            <Badge className={cn("capitalize", getStatusBadgeColor(task.status))}>
              {TASK_STATUSES.find(s => s.value === task.status)?.label || task.status}
            </Badge>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
          {task.due_date && (
            <p className="text-sm text-muted-foreground">
              Due: {formatDate(task.due_date)}
            </p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task)}
            disabled={deletingId === task.id}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 