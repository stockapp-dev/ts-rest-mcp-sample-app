import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { RouteInvoker } from "./route-invoker"
import { McpToolDefinition, ToolCache } from "./tool-cache"

export class ToolRegistrar {
  constructor(private routeInvoker: RouteInvoker) {}

  registerAllTools(server: McpServer) {
    const toolDefinitions = ToolCache.getToolDefinitions()

    for (const toolDef of toolDefinitions) {
      this.registerTool(server, toolDef)
    }

    console.log(`🚀 Registered ${toolDefinitions.length} MCP tools with server`)
  }

  private registerTool(server: McpServer, toolDef: McpToolDefinition) {
    server.registerTool(
      toolDef.name,
      {
        description: toolDef.description,
        inputSchema: toolDef.inputSchema,
      },
      async (params, extra) => this.routeInvoker.invokeRoute(toolDef.contractPath, toolDef.endpoint, params, extra)
    )
  }
}
