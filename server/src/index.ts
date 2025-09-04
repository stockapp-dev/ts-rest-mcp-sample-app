import { tasksContract } from "@sample-app/contracts"

import * as tasksRoutes from "./routes/tasks.routes"

// Create the contractMap and routeMap matching the pattern from the blog post
export const contractMap = {
  tasks: tasksContract,
}

export const routeMap = {
  tasks: tasksRoutes,
}
