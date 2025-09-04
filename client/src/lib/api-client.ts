import { tasksContract } from "@sample-app/contracts"
import { initClient } from "@ts-rest/core"

const API_URL = "http://localhost:1337"

// Create type-safe ts-rest client
export function createApiClient(authHeader: string) {
  return initClient(tasksContract, {
    baseUrl: API_URL,
    baseHeaders: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  })
}

// Re-export contract types for convenience
export type { tasksContract } from "@sample-app/contracts"
