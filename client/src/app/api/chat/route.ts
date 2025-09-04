import { openai } from "@ai-sdk/openai"
import { Agent } from "@mastra/core/agent"
import { RuntimeContext } from "@mastra/core/di"
import { MCPClient } from "@mastra/mcp"
import { NextRequest, NextResponse } from "next/server"

// Type for our runtime context
type TaskServiceRuntimeContext = {
  authHeader: string
}

/**
 * Create a dynamic MCP client for the task service
 * This uses RuntimeContext to pass auth credentials dynamically
 */
function createTaskServiceMCPClient(runtimeContext: RuntimeContext<TaskServiceRuntimeContext>) {
  const authHeader = runtimeContext.get("authHeader")
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:1337"

  return new MCPClient({
    id: "task-service-dynamic", // ID to prevent memory leaks
    servers: {
      tasks: {
        url: new URL(`${serverUrl}/mcp`),
        requestInit: {
          headers: {
            Authorization: authHeader,
          },
        },
        timeout: 30000, // 30 second timeout for API calls
      },
    },
  })
}

// Create agent with dynamic MCP tools
const createTaskAssistantAgent = () =>
  new Agent({
    id: "taskAssistant",
    name: "Task Assistant",
    instructions: `You are a helpful task management assistant.

When users ask you to perform task operations, use the available tools.
Be concise in your responses and confirm what actions you've taken.`,
    model: openai("gpt-4o-mini"),
    tools: async ({ runtimeContext }) => {
      // Start with empty tools as fallback
      const staticTools = {}

      // Add MCP tools dynamically if we have auth context
      const authHeader = runtimeContext?.get("authHeader")
      if (authHeader) {
        try {
          const mcpClient = createTaskServiceMCPClient(runtimeContext)
          const mcpTools = await mcpClient.getTools()

          // Combine static and MCP tools
          return {
            ...staticTools,
            ...mcpTools,
          }
        } catch (error) {
          console.warn("Failed to load MCP tools, falling back to static tools:", error)
          return staticTools
        }
      }

      // Fallback to just static tools if no auth
      return staticTools
    },
  })

export async function POST(request: NextRequest) {
  try {
    const { message, authHeader } = await request.json()

    // Create runtime context with auth credentials
    const runtimeContext = new RuntimeContext<TaskServiceRuntimeContext>()
    runtimeContext.set("authHeader", authHeader)

    // Create agent instance
    const agent = createTaskAssistantAgent()

    // Execute agent with runtime context
    const result = await agent.generate(message, { runtimeContext })

    return NextResponse.json({
      message: result.text,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
  }
}
