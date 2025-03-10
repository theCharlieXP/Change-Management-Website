'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { format, isValid, startOfToday, parseISO } from 'date-fns'
import { CalendarIcon, Plus, X, Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectTask, TaskStatus } from '@/types/projects'
import { toast } from '@/components/ui/use-toast'
import { TaskEditModal } from './task-edit-modal'
import CustomDatePicker from '@/components/ui/custom-date-picker'
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskItem } from './task-item'

interface ProjectTasksProps {
  tasks: ProjectTask[]
  projectId: string
  onAdd: (task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onUpdate: (id: string, task: Partial<ProjectTask>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder: (tasks: ProjectTask[]) => Promise<void>
}

const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800 border-red-200' }
]

export function ProjectTasks({ tasks, projectId, onAdd, onUpdate, onDelete, onReorder }: ProjectTasksProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onAdd({
        project_id: projectId,
        title,
        description,
        status,
        due_date: dueDate && isValid(dueDate) ? dueDate.toISOString() : null,
        position: tasks.length,
        user_id: ''
      })

      // Reset form
      setTitle('')
      setDescription('')
      setStatus('todo')
      setDueDate(undefined)
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding task:', error)
      setError(error instanceof Error ? error.message : 'Failed to add task')
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add task",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
      setTaskToDelete(null)
      toast({
        title: "Success",
        description: `Task &quot;${taskToDelete?.title}&quot; deleted successfully.`,
        variant: "default"
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id)
      const newIndex = tasks.findIndex(task => task.id === over.id)

      console.log('Reordering tasks:', {
        oldIndex,
        newIndex,
        activeId: active.id,
        overId: over.id,
        tasks
      })

      const newTasks = [...tasks]
      const [movedTask] = newTasks.splice(oldIndex, 1)
      newTasks.splice(newIndex, 0, movedTask)

      // Update positions
      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        position: index
      }))

      console.log('Updated task order:', {
        updatedTasks,
        originalTasks: tasks
      })

      try {
        await onReorder(updatedTasks)
      } catch (error) {
        console.error('Failed to reorder tasks:', error)
        toast({
          title: "Error",
          description: "Failed to reorder tasks. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return null
    const parsed = new Date(date)
    if (!isValid(parsed)) return null
    return format(parsed, 'PPP')
  }

  const getStatusBadgeColor = (status: TaskStatus) => {
    const statusConfig = TASK_STATUSES.find(s => s.value === status)
    return statusConfig?.color || 'bg-slate-100 text-slate-800 border-slate-200'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? (
            'Cancel'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task description"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={status}
                      onValueChange={(value: TaskStatus) => setStatus(value)}
                      disabled={loading}
                    >
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <div className="w-full">
                      <CustomDatePicker
                        selectedDate={dueDate || null}
                        onChange={(date: Date | null) => setDueDate(date || undefined)}
                        disabled={loading}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-500">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading || !title}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Task...
                      </>
                    ) : (
                      'Add Task'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={setTaskToDelete}
                getStatusBadgeColor={getStatusBadgeColor}
                formatDate={formatDate}
                deletingId={deletingId}
              />
            ))}
            
            {tasks.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No tasks yet. Click &quot;Add Task&quot; to create one.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          open={true}
          onClose={() => setEditingTask(null)}
          onUpdate={onUpdate}
        />
      )}

      <Dialog open={taskToDelete !== null} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTaskToDelete(null)}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => taskToDelete && handleDelete(taskToDelete.id)}
              disabled={deletingId !== null}
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 