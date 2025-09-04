import { v4 as uuidv4 } from "uuid"

export interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  assigned_to?: string
  created_at: string
  updated_at: string
}

/**
 * In-memory database for demonstration purposes.
 * In production, this would be replaced with a real database.
 */
class InMemoryDatabase {
  private tasks: Map<string, Task> = new Map()

  constructor() {
    // Initialize with some sample data
    this.seedData()
  }

  private seedData() {
    const sampleTasks: Omit<Task, "id" | "created_at" | "updated_at">[] = [
      {
        title: "Refill the kombucha kegerator",
        status: "pending",
        priority: "high",
        assigned_to: "alice",
      },
      {
        title: "Update API documentation",
        status: "in_progress",
        priority: "medium",
        assigned_to: "bob",
      },
      {
        title: "Stock the snack wall",
        status: "pending",
        priority: "high",
        assigned_to: "charlie",
      },
      {
        title: "Book the rooftop for all-hands",
        status: "pending",
        priority: "low",
      },
      {
        title: "Set up GitHub Actions",
        status: "in_progress",
        priority: "high",
        assigned_to: "alice",
      },
    ]

    for (const task of sampleTasks) {
      const id = uuidv4()
      const now = new Date().toISOString()
      this.tasks.set(id, {
        ...task,
        id,
        created_at: now,
        updated_at: now,
      })
    }
  }

  // Task operations
  async findAllTasks(filters?: { status?: Task["status"]; assigned_to?: string; limit?: number }): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values())

    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status)
    }

    if (filters?.assigned_to) {
      tasks = tasks.filter((t) => t.assigned_to === filters.assigned_to)
    }

    // Sort by priority (high to low) then by created_at (descending)
    const priorityOrder = { high: 1, medium: 2, low: 3 }
    tasks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return b.created_at.localeCompare(a.created_at)
    })

    if (filters?.limit) {
      tasks = tasks.slice(0, filters.limit)
    }

    return tasks
  }

  async findTaskById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null
  }

  async createTask(data: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
    const id = uuidv4()
    const now = new Date().toISOString()
    const task: Task = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    }
    this.tasks.set(id, task)
    return task
  }

  async updateTask(id: string, updates: Partial<Omit<Task, "id" | "created_at">>): Promise<Task | null> {
    const task = this.tasks.get(id)
    if (!task) return null

    const updatedTask: Task = {
      ...task,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    this.tasks.set(id, updatedTask)
    return updatedTask
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id)
  }

  // Statistics
  async getTaskStats(): Promise<{
    total: number
    by_status: Record<Task["status"], number>
    by_priority: Record<Task["priority"], number>
    assigned_count: number
    unassigned_count: number
  }> {
    const tasks = Array.from(this.tasks.values())

    const stats = {
      total: tasks.length,
      by_status: {
        pending: 0,
        in_progress: 0,
        completed: 0,
      },
      by_priority: {
        low: 0,
        medium: 0,
        high: 0,
      },
      assigned_count: 0,
      unassigned_count: 0,
    }

    for (const task of tasks) {
      stats.by_status[task.status]++
      stats.by_priority[task.priority]++
      if (task.assigned_to) {
        stats.assigned_count++
      } else {
        stats.unassigned_count++
      }
    }

    return stats
  }

  // Clear all data (useful for testing)
  async clear(): Promise<void> {
    this.tasks.clear()
  }

  // Reset to initial seed data
  async reset(): Promise<void> {
    this.tasks.clear()
    this.seedData()
  }
}

// Export singleton instance
export const db = new InMemoryDatabase()
