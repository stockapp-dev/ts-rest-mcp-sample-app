import { initContract } from "@ts-rest/core"
import { z } from "zod"

const c = initContract()

// Schema definitions
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["pending", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assigned_to: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
})

export const CreateTaskSchema = TaskSchema.pick({
  title: true,
  description: true,
  priority: true,
  assigned_to: true,
})

export const UpdateTaskSchema = TaskSchema.partial().pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  assigned_to: true,
})

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
})

// Contract definition with MCP metadata
export const tasksContract = c.router({
  listTasks: {
    method: "GET",
    path: "/tasks",
    query: z.object({
      status: TaskSchema.shape.status.optional(),
      priority: TaskSchema.shape.priority.optional(),
      assigned_to: z.string().optional(),
      limit: z.coerce.number().positive().max(100).default(20),
      offset: z.coerce.number().nonnegative().default(0),
    }),
    responses: {
      200: z.object({
        tasks: z.array(TaskSchema),
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
      }),
      401: ErrorSchema,
    },
    summary: "List all tasks with optional filtering",
    metadata: {
      mcp: true,
      guidance: `Use this to retrieve tasks. 
                 Filter by status when user asks for specific task states (pending, in progress, completed).
                 Filter by priority when user asks for important/urgent tasks.
                 Use pagination with limit and offset for large result sets.`,
    },
  },

  getTask: {
    method: "GET",
    path: "/tasks/:id",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: TaskSchema,
      401: ErrorSchema,
      404: ErrorSchema,
    },
    summary: "Get a specific task by ID",
    metadata: {
      mcp: true,
      guidance: `Use this to retrieve details about a specific task when the user references it by ID.`,
    },
  },

  createTask: {
    method: "POST",
    path: "/tasks",
    body: CreateTaskSchema,
    responses: {
      201: TaskSchema,
      400: ErrorSchema,
      401: ErrorSchema,
    },
    summary: "Create a new task",
    metadata: {
      mcp: true,
      guidance: `Use this when the user wants to create a new task, reminder, or to-do item.
                 Set priority based on urgency keywords: urgent/important = high, normal = medium, later = low.
                 If the user mentions assigning to someone, set the assigned_to field to their username.`,
    },
  },

  updateTask: {
    method: "PATCH",
    path: "/tasks/:id",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateTaskSchema,
    responses: {
      200: TaskSchema,
      400: ErrorSchema,
      401: ErrorSchema,
      404: ErrorSchema,
    },
    summary: "Update an existing task",
    metadata: {
      mcp: true,
      guidance: `Use this to update task properties like status, priority, description, or assignee.
                 Common updates: marking as completed, changing priority, updating description, assigning to someone.`,
    },
  },

  deleteTask: {
    method: "DELETE",
    path: "/tasks/:id",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      401: ErrorSchema,
      404: ErrorSchema,
    },
    summary: "Delete a task",
    metadata: {
      mcp: true,
      guidance: `Use this when the user wants to remove or delete a task permanently.
                 Confirm with user before deletion if the task contains important information.`,
    },
  },

  searchTasks: {
    method: "GET",
    path: "/tasks/search",
    query: z.object({
      q: z.string().min(1).describe("Search query to match against title and description"),
      limit: z.coerce.number().positive().max(100).default(10),
    }),
    responses: {
      200: z.object({
        tasks: z.array(TaskSchema),
        query: z.string(),
        count: z.number(),
      }),
      401: ErrorSchema,
    },
    summary: "Search tasks by text query",
    metadata: {
      mcp: true,
      guidance: `Use this when the user wants to find tasks by searching for keywords.
                 Searches both title and description fields.`,
    },
  },
})

// Export inferred types for convenience
export type Task = z.infer<typeof TaskSchema>
export type CreateTask = z.infer<typeof CreateTaskSchema>
export type UpdateTask = z.infer<typeof UpdateTaskSchema>
export type TaskStatus = Task["status"]
export type TaskPriority = Task["priority"]
