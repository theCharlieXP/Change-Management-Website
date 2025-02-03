'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, isValid, startOfToday } from 'date-fns'
import { CalendarIcon, Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectTask, TaskStatus } from '@/types/projects'

interface ProjectTasksProps {
  tasks: ProjectTask[]
  projectId: string
  onAdd: (task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onUpdate: (id: string, task: Partial<ProjectTask>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-800 border-red-200' }
]

export function ProjectTasks({ tasks, projectId, onAdd, onUpdate, onDelete }: ProjectTasksProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
        due_date: dueDate && isValid(dueDate) ? dueDate.toISOString() : null
      })

      // Reset form
      setTitle('')
      setDescription('')
      setStatus('todo')
      setDueDate(undefined)
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding task:', error)
      setError('Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return null
    const parsed = new Date(date)
    if (!isValid(parsed)) return null
    return format(parsed, 'PPP')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
                    <SelectTrigger id="status">
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                        disabled={loading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate && isValid(dueDate) ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <Button 
                          variant="ghost" 
                          className="text-sm w-full justify-start font-normal"
                          onClick={() => setDueDate(undefined)}
                        >
                          Clear date
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        disabled={(date) => date < startOfToday()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
      )}

      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => handleDelete(task.id)}
              disabled={deletingId === task.id}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader>
              <div className="flex items-start gap-2">
                <Select
                  value={task.status}
                  onValueChange={(value: TaskStatus) => onUpdate(task.id, { status: value })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      <Badge className={cn(
                        TASK_STATUSES.find(s => s.value === task.status)?.color
                      )}>
                        {TASK_STATUSES.find(s => s.value === task.status)?.label}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CardTitle className="text-lg mt-2">{task.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description && (
                <p className="text-muted-foreground mb-4">{task.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {task.due_date && formatDate(task.due_date) && (
                  <span className={cn(
                    "flex items-center gap-2",
                    new Date(task.due_date) < startOfToday() ? "text-red-500" : ""
                  )}>
                    <CalendarIcon className="h-4 w-4" />
                    Due: {formatDate(task.due_date)}
                  </span>
                )}
                <span>Created: {formatDate(task.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 