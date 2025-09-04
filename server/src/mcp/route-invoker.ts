import * as taskRoutes from "../routes/tasks.routes"
import { MCPError } from "./utils/mcp-error"

const routeMap = {
  tasks: taskRoutes,
} as const

export class RouteInvoker {
  async invokeRoute(contractPath: string[], endpoint: any, mcpParams: any, extra: any) {
    try {
      // Get the route implementation
      const routeFunction = this.getRouteFunction(contractPath)

      // Transform MCP's flat parameters to REST's structured format
      const params: any = {}
      const query: any = {}
      const body: any = {}

      // Get parameter definitions from endpoint
      const pathParamKeys = endpoint.pathParams?.shape ? Object.keys(endpoint.pathParams.shape) : []
      const queryKeys = endpoint.query?.shape ? Object.keys(endpoint.query.shape) : []
      const bodyKeys = endpoint.body?.shape ? Object.keys(endpoint.body.shape) : []

      // Distribute parameters to correct locations
      for (const [key, value] of Object.entries(mcpParams)) {
        if (pathParamKeys.includes(key)) {
          params[key] = value
        } else if (queryKeys.includes(key)) {
          query[key] = value
        } else if (bodyKeys.includes(key)) {
          body[key] = value
        }
      }

      const routeParams = {
        params,
        query,
        body: Object.keys(body).length > 0 ? body : undefined,
        headers: extra?.requestInfo?.headers || {},
        req: {
          headers: extra?.requestInfo?.headers || {},
          ...extra?.authInfo?.req,
        },
        res: extra?.authInfo?.res || {},
      }

      // Call the route function directly
      const routeResponse = await routeFunction(routeParams)

      // Format route response to MCP format inline
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(routeResponse.body, null, 2),
          },
        ],
      }
    } catch (error: any) {
      return this.handleRouteError(error, endpoint)
    }
  }

  private getRouteFunction(contractPath: string[]) {
    // Navigate the routeMap using the same path structure as contracts
    let current: any = routeMap
    for (const segment of contractPath) {
      current = current[segment]
      if (!current) {
        throw new MCPError("SYSTEM", `Route not found: ${contractPath.join(".")}`)
      }
    }

    if (typeof current !== "function") {
      throw new MCPError("SYSTEM", `Route is not a function: ${contractPath.join(".")}`)
    }

    return current
  }

  private handleRouteError(error: any, endpoint: any): any {
    console.error(`Route error for ${endpoint.method} ${endpoint.path}:`, error)

    // Determine error type based on status code
    const status = error.status || error.statusCode || 500
    const errorType = status >= 400 && status < 500 ? "USER" : "SYSTEM"

    const mcpError = new MCPError(errorType, error.message || "Route execution failed", status)

    // Format error response inline
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${mcpError.message}`,
        },
      ],
    }
  }
}
