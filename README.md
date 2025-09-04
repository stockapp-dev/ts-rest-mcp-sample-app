# ts-rest + MCP Demo

Automatically expose [ts-rest](https://ts-rest.com/) API endpoints as [MCP](https://modelcontextprotocol.io/) tools. Add `metadata: { mcp: true }` to any endpoint and it becomes available to AI assistants with zero duplicate code.

Both your UI and AI assistant call the same route handlers with identical auth, validation, and business logic.

## Quick Start

**Prerequisites:** Node.js 18+ and [OpenAI API key](https://platform.openai.com/api-keys)

```bash
# 1. Clone and install
git clone https://github.com/stockapp-dev/ts-rest-mcp-sample-app
cd ts-rest-mcp-sample-app
npm install

# 2. Add your OpenAI API key
cp client/.env.example client/.env.local
# Edit client/.env.local and add: OPENAI_API_KEY=sk-proj-your-key-here

# 3. Start everything
npm run dev

# 4. Open the demo
open http://localhost:1336
```

You'll see a task management interface with:
- **Left panel:** Direct REST API interaction using ts-rest client
- **Right panel:** AI assistant using the same endpoints via MCP tools

## 📁 Project Structure

```
sample-app/
├── packages/
│   └── contracts/       # Shared ts-rest contracts package
│       ├── src/
│       │   ├── tasks.contract.ts  # API contracts (single source of truth)
│       │   └── index.ts           # Contract exports
│       └── package.json
│
├── server/              # Express server with REST + MCP
│   ├── src/
│   │   ├── routes/      # Route handlers (called by both REST and MCP!)
│   │   ├── mcp/         # MCP server setup
│   │   └── index.ts     # Main server entry
│   └── package.json     # Depends on @sample-app/contracts
│
├── client/              # Next.js UI with Mastra agent
│   ├── src/
│   │   ├── app/         # Next.js app router
│   │   ├── components/  # TaskList (ts-rest client) and Chat (MCP)
│   │   ├── lib/         # API client using shared contracts
│   │   └── api/chat/    # Mastra agent endpoint
│   └── package.json     # Depends on @sample-app/contracts
│
├── turbo.json          # Turborepo configuration
└── package.json        # Root workspace
```

## 🔍 How It Works

1. **Shared Contracts Package** (`packages/contracts/src/tasks.contract.ts`):
   - Single source of truth for all API definitions
   - Endpoints, parameters, validation, responses
   - Metadata flags which endpoints become MCP tools
   - Shared between server and client applications

2. **Single Implementation** (`server/src/routes/tasks.routes.ts`):
   - Route handlers that process all requests
   - Auth checks, business logic, database access

3. **Two Interfaces, Same Process**:
   - **REST API**: Express router serves HTTP endpoints
   - **MCP Server**: SSE endpoint at `/mcp` exposes tools
   - Both call the same route handler functions directly!

4. **Type-Safe Client** (`client/src/lib/api-client.ts`):
   - Uses shared contracts for full type safety
   - No manual API calls or duplicated types
   - Same contracts power both UI and MCP tools

5. **Demo UI** shows this in action:
   - Left panel: Type-safe ts-rest client calls  
   - Right panel: AI assistant using MCP tools
   - Changes from either side appear instantly (same in-memory DB)

## See It In Action

The demo UI demonstrates the pattern in action:

- **Left panel:** Direct REST API interaction using a type-safe ts-rest client
- **Right panel:** AI assistant using MCP tools to perform the same operations

![ts-rest + MCP Demo Interface](https://d2xm45dyri6raz.cloudfront.net/blog/ts-rest-mcp-1.png)
*The split interface showing REST API on the left and AI Assistant powered by MCP tools on the right*

Try creating a task in the left panel, then asking the AI assistant: *"Show me all tasks"* - you'll see your task immediately because both interfaces use the same in-memory database and route handlers.

![AI Assistant Creating Tasks](https://d2xm45dyri6raz.cloudfront.net/blog/ts-rest-mcp-2.png)
*The AI assistant creating and managing tasks using MCP tools that call the same route handlers as the REST API*

### Test the REST API Directly

```bash
# Create a task via REST
curl -X POST http://localhost:1337/tasks \
  -H "Authorization: Basic ZGVtbzpkZW1vMTIz" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test the API integration", "priority": "high"}'

# List all tasks
curl http://localhost:1337/tasks \
  -H "Authorization: Basic ZGVtbzpkZW1vMTIz"
```

### Test the AI Assistant

Ask the AI assistant natural language questions:
- *"Create a task to order more cold brew kegs"*
- *"Show me all pending tasks"*  
- *"Mark any high priority tasks as completed"*
- *"Assign the kegs task to sarah"*

The AI uses the same endpoints and validation as your REST API, but with natural language understanding.

## Key Implementation Details

### Contract-Driven Architecture

The `packages/contracts/` package defines all API endpoints once using ts-rest and Zod:

```typescript
export const tasksContract = c.router({
  createTask: {
    method: "POST",
    path: "/tasks",
    body: CreateTaskSchema,
    responses: { 201: TaskSchema },
    summary: "Create a new task",
    metadata: {
      mcp: true, // 👈 This exposes the endpoint as an MCP tool
      guidance: `Use this when the user wants to create a task. 
                 Set priority based on urgency keywords.`
    }
  }
})
```

### Automatic Tool Generation  

The MCP server scans contracts at startup and registers tools automatically:

```typescript
// No manual tool registration needed!
ToolCache.discoverToolsFromContracts() // Finds all endpoints with mcp: true
```

### Shared Route Handlers

Both interfaces call the same functions with the same validation:

```typescript
export const createTask = async ({ body, req }) => {
  const authError = await checkAuth(req) // Same auth for both!
  if (authError) return authError
  
  const task = await db.createTask(body) // Same business logic!
  return { status: 201, body: task }
}
```

## Learn More

- **[Read the full blog post](https://blog.stockapp.com/ship-fast-to-both-humans-and-ai-using-ts-rest-mcp/)** - Deep dive into the architecture and why this pattern matters
- **[ts-rest documentation](https://ts-rest.com)** - Learn about contract-first API development
- **[MCP Protocol](https://modelcontextprotocol.io)** - Understand the Model Context Protocol  
- **[Mastra](https://mastra.ai)** - AI agent framework used in this demo

## Authentication

For demo purposes, we use basic auth (username: `demo`, password: `demo123`).

In production, you'd implement proper JWT/OAuth with user-specific permissions. The pattern works the same - just update your `checkAuth` function and both REST and MCP interfaces inherit the changes automatically.
