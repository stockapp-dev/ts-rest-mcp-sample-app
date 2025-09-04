import { tasksContract } from "@sample-app/contracts"
import { AppRouteImplementation } from "@ts-rest/express"

import { checkAuth } from "../auth/middleware"
import { db } from "../db/in-memory-db"

// Route implementations that are called by BOTH REST and MCP
// Authentication happens here, ensuring consistent security across both interfaces
export const listTasks: AppRouteImplementation<typeof tasksContract.listTasks> = async ({ query, req }) => {
  // This auth check runs for both REST API calls AND MCP tool invocations
  const authError = await checkAuth(req as any)
  if (authError) return authError

  const tasks = await db.findAllTasks({
    status: query?.status,
    assigned_to: query?.assigned_to,
    limit: query?.limit || 20,
  })

  return {
    status: 200 as const,
    body: {
      tasks,
      total: tasks.length,
      limit: query?.limit || 20,
      offset: query?.offset || 0,
    },
  }
}

export const getTask: AppRouteImplementation<typeof tasksContract.getTask> = async ({ params, req }) => {
  const authError = await checkAuth(req as any)
  if (authError) return authError

  const task = await db.findTaskById(params.id)
  if (!task) {
    return {
      status: 404 as const,
      body: {
        code: "NOT_FOUND",
        message: `Task ${params.id} not found`,
      },
    }
  }

  return {
    status: 200 as const,
    body: task,
  }
}

export const createTask: AppRouteImplementation<typeof tasksContract.createTask> = async ({ body, req }) => {
  const authError = await checkAuth(req as any)
  if (authError) return authError

  const task = await db.createTask({
    title: body.title,
    description: body.description,
    priority: body.priority || "medium",
    assigned_to: body.assigned_to,
    status: "pending",
  })

  return {
    status: 201 as const,
    body: task,
  }
}

export const updateTask: AppRouteImplementation<typeof tasksContract.updateTask> = async ({ params, body, req }) => {
  const authError = await checkAuth(req as any)
  if (authError) return authError

  const task = await db.updateTask(params.id, body)
  if (!task) {
    return {
      status: 404 as const,
      body: {
        code: "NOT_FOUND",
        message: `Task ${params.id} not found`,
      },
    }
  }

  return {
    status: 200 as const,
    body: task,
  }
}

export const deleteTask: AppRouteImplementation<typeof tasksContract.deleteTask> = async ({ params, req }) => {
  const authError = await checkAuth(req as any)
  if (authError) return authError

  const deleted = await db.deleteTask(params.id)
  if (!deleted) {
    return {
      status: 404 as const,
      body: {
        code: "NOT_FOUND",
        message: `Task ${params.id} not found`,
      },
    }
  }

  return {
    status: 204 as const,
    body: undefined,
  }
}

export const searchTasks: AppRouteImplementation<typeof tasksContract.searchTasks> = async ({ query, req }) => {
  const authError = await checkAuth(req as any)
  if (authError) return authError

  // Simple search implementation - in production would use full text search
  const allTasks = await db.findAllTasks({ limit: query.limit || 10 })
  const tasks = allTasks.filter((t) => t.title.toLowerCase().includes(query.q.toLowerCase()))

  return {
    status: 200 as const,
    body: {
      tasks,
      query: query.q,
      count: tasks.length,
    },
  }
}
