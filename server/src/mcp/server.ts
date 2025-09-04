import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { RouteInvoker } from "./route-invoker"
import { ToolRegistrar } from "./tool-registrar"

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "Task Management MCP Server",
    version: "1.0.0",
  })

  // Initialize route invoker (stateless, can be reused)
  const routeInvoker = new RouteInvoker()
  const toolRegistrar = new ToolRegistrar(routeInvoker)

  // Register all MCP tools from ts-rest contracts
  toolRegistrar.registerAllTools(server)

  return server
}
