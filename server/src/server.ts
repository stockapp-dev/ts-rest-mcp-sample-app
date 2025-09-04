import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { tasksContract } from "@sample-app/contracts"
import { createExpressEndpoints } from "@ts-rest/express"
import { generateOpenApi } from "@ts-rest/open-api"
import cors from "cors"
import express from "express"
import * as swaggerUi from "swagger-ui-express"

import { authMiddleware } from "./auth/middleware"
import { createMcpServer } from "./mcp/server"
import * as tasksRoutes from "./routes/tasks.routes"

const app = express()
const PORT = process.env.PORT || 1337

// Middleware
app.use(cors())
app.use(express.json())

// Generate OpenAPI documentation
const openApiDocument = generateOpenApi(
  tasksContract,
  {
    info: {
      title: "Tasks API with MCP",
      version: "1.0.0",
      description: "Example API demonstrating ts-rest + MCP integration",
    },
  },
  {
    setOperationId: "concatenated-path",
  }
)

// Serve API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument))
app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument)
})

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Register REST endpoints with authentication
createExpressEndpoints(tasksContract, tasksRoutes, app, {
  globalMiddleware: [authMiddleware],
  requestValidationErrorHandler: (err, _req, res) => {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      details: err.body?.issues || err.query?.issues || err.pathParams?.issues,
    })
  },
})

// Setup MCP HTTP transport
app.post("/mcp", async (req, res) => {
  const server = createMcpServer()
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
    await server.connect(transport)
    console.log("✅ MCP client connected")

    await transport.handleRequest(req, res, req.body)

    res.on("close", () => {
      console.log("MCP request closed")
      transport.close()
      server.close()
    })
  } catch (error) {
    console.error("❌ MCP connection error:", error)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
          data: error instanceof Error ? error.message : "Unknown error",
        },
        id: null,
      })
    }
  }
})

// MCP endpoint info
app.get("/mcp-info", (_req, res) => {
  res.json({
    message: "Real MCP server using @modelcontextprotocol/sdk",
    endpoint: "POST /mcp",
    transport: "StreamableHTTP",
    description: "The MCP server automatically exposes all endpoints marked with 'mcp: true' in the contract",
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server running on http://localhost:${PORT}

Available endpoints:
  📚 API Documentation: http://localhost:${PORT}/api-docs
  🔧 OpenAPI Spec: http://localhost:${PORT}/openapi.json
  🤖 MCP Endpoint: http://localhost:${PORT}/mcp (StreamableHTTP)
  ℹ️  MCP Info: http://localhost:${PORT}/mcp-info
  
REST API:
  GET    /tasks           - List all tasks
  GET    /tasks/search    - Search tasks
  GET    /tasks/:id       - Get specific task
  POST   /tasks           - Create task
  PATCH  /tasks/:id       - Update task
  DELETE /tasks/:id       - Delete task

MCP Server (Real SDK):
  POST   /mcp  - StreamableHTTP MCP transport
  
Available MCP tools:
  tasks_list_tasks    - List tasks
  tasks_search_tasks  - Search tasks
  tasks_get_task      - Get task by ID
  tasks_create_task   - Create new task
  tasks_update_task   - Update task
  tasks_delete_task   - Delete task

Authentication:
  Username: demo
  Password: demo123
  Header: Authorization: Basic ZGVtbzpkZW1vMTIz
  `)
})
