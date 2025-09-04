"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createApiClient } from "@/lib/api-client"
import type { Task } from "@sample-app/contracts"
import { useEffect, useState } from "react"

export default function TaskList({ authHeader, onUpdate }: { authHeader: string; onUpdate: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({})

  // Create ts-rest client with auth header
  const apiClient = createApiClient(authHeader)

  const fetchTasks = async () => {
    try {
      const result = await apiClient.listTasks({
        query: { limit: 20 },
      })

      if (result.status === 200) {
        setTasks(result.body.tasks)
      } else {
        console.error("Failed to fetch tasks:", result.body)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [authHeader]) // eslint-disable-line react-hooks/exhaustive-deps

  const createTask = async () => {
    if (!newTitle.trim()) return

    try {
      const result = await apiClient.createTask({
        body: {
          title: newTitle,
          priority: "medium",
        },
      })

      if (result.status === 201) {
        setNewTitle("")
        await fetchTasks()
        onUpdate() // Tell parent to refresh
      } else {
        console.error("Failed to create task:", result.body)
      }
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  const updateStatus = async (id: string, status: Task["status"]) => {
    try {
      const result = await apiClient.updateTask({
        params: { id },
        body: { status },
      })

      if (result.status === 200) {
        await fetchTasks()
        onUpdate() // Tell parent to refresh
      } else {
        console.error("Failed to update task:", result.body)
      }
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const result = await apiClient.deleteTask({
        params: { id },
      })

      if (result.status === 204) {
        await fetchTasks()
        onUpdate() // Tell parent to refresh
      } else {
        console.error("Failed to delete task:", result.body)
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const updateTaskField = async (id: string, field: string, value: string) => {
    try {
      const updateData: Record<string, string | undefined> = {}
      updateData[field] = value || undefined // Convert empty string to undefined for unassign

      const result = await apiClient.updateTask({
        params: { id },
        body: updateData,
      })

      if (result.status === 200) {
        await fetchTasks()
        onUpdate() // Tell parent to refresh
      } else {
        console.error("Failed to update task:", result.body)
      }
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const startEditing = (taskId: string, field: string, currentValue: string) => {
    if (field === "title") {
      setEditingTitle(taskId)
    } else if (field === "assigned_to") {
      setEditingAssignee(taskId)
    }
    setEditValues((prev) => ({ ...prev, [`${taskId}_${field}`]: currentValue }))
  }

  const stopEditing = async (taskId: string, field: string) => {
    const key = `${taskId}_${field}`
    const value = editValues[key]

    if (field === "title") {
      setEditingTitle(null)
    } else if (field === "assigned_to") {
      setEditingAssignee(null)
    }

    // Only update if value changed
    const task = tasks.find((t) => t.id === taskId)
    const currentValue = field === "title" ? task?.title : task?.assigned_to
    if (value !== currentValue) {
      await updateTaskField(taskId, field, value)
    }

    setEditValues((prev) => {
      const newValues = { ...prev }
      delete newValues[key]
      return newValues
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, taskId: string, field: string) => {
    if (e.key === "Enter") {
      e.preventDefault()
      stopEditing(taskId, field)
    }
    if (e.key === "Escape") {
      if (field === "title") {
        setEditingTitle(null)
      } else if (field === "assigned_to") {
        setEditingAssignee(null)
      }
      setEditValues((prev) => {
        const newValues = { ...prev }
        delete newValues[`${taskId}_${field}`]
        return newValues
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="bg-muted h-4 w-3/4 rounded"></div>
            <div className="bg-muted h-4 w-1/2 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add new task */}
        <div className="mb-4 flex gap-2">
          <Input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTask()}
            placeholder="New task title..."
            className="flex-1"
          />
          <Button onClick={createTask} size="sm">
            Add Task
          </Button>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No tasks yet</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <Select value={task.status} onValueChange={(value) => updateStatus(task.id, value as Task["status"])}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      {task.status === "pending" && (
                        <span className="flex items-center gap-2">
                          <span className="bg-muted-foreground h-2 w-2 rounded-full"></span>
                          Pending
                        </span>
                      )}
                      {task.status === "in_progress" && (
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          In Progress
                        </span>
                      )}
                      {task.status === "completed" && (
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Completed
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1">
                  {editingTitle === task.id ? (
                    <Input
                      value={editValues[`${task.id}_title`] || ""}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [`${task.id}_title`]: e.target.value }))}
                      onBlur={() => stopEditing(task.id, "title")}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "title")}
                      className="focus:bg-background focus:border-border h-7 border-none bg-transparent px-1 py-1 text-sm font-medium shadow-none"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="hover:bg-muted/50 flex h-7 cursor-pointer items-center rounded px-1 py-1 font-medium"
                      onClick={() => startEditing(task.id, "title", task.title)}
                    >
                      {task.title}
                    </div>
                  )}

                  {editingAssignee === task.id ? (
                    <Input
                      value={editValues[`${task.id}_assigned_to`] || ""}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [`${task.id}_assigned_to`]: e.target.value }))
                      }
                      onBlur={() => stopEditing(task.id, "assigned_to")}
                      onKeyDown={(e) => handleKeyDown(e, task.id, "assigned_to")}
                      className="text-muted-foreground focus:bg-background focus:border-border mt-1 h-6 border-none bg-transparent px-1 py-1 text-sm shadow-none"
                      placeholder="username or empty to unassign"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="text-muted-foreground hover:bg-muted/50 mt-1 flex h-6 cursor-pointer items-center rounded px-1 py-1 text-sm"
                      onClick={() => startEditing(task.id, "assigned_to", task.assigned_to || "")}
                    >
                      {task.assigned_to ? (
                        `@${task.assigned_to}`
                      ) : (
                        <span className="text-muted-foreground/60 italic">click to assign</span>
                      )}
                    </div>
                  )}
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    task.priority === "high"
                      ? "bg-destructive/20 text-destructive"
                      : task.priority === "medium"
                        ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {task.priority}
                </span>

                <Button
                  onClick={() => deleteTask(task.id)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  🗑️
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
