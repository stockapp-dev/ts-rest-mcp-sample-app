import { tasksContract } from "@sample-app/contracts"

const contractMap = {
  tasks: tasksContract,
} as const

export interface McpToolDefinition {
  name: string
  description: string
  guidance?: string
  inputSchema: any
  contractPath: string[]
  endpoint: any
}

export class ToolCache {
  private static toolDefinitions: McpToolDefinition[] | null = null

  static initialize(): void {
    console.log("🚀 Initializing MCP tool cache...")
    this.toolDefinitions = this.discoverToolsFromContracts()
    console.log(`✅ Initialized tool cache with ${this.toolDefinitions.length} MCP tools`)
  }

  static getToolDefinitions(): McpToolDefinition[] {
    if (this.toolDefinitions === null) {
      console.log("🔧 Discovering MCP tools from contracts...")
      this.toolDefinitions = this.discoverToolsFromContracts()
      console.log(`✅ Discovered ${this.toolDefinitions.length} MCP tools`)
    }
    return this.toolDefinitions
  }

  private static discoverToolsFromContracts(): McpToolDefinition[] {
    const tools: McpToolDefinition[] = []

    // Iterate through top-level contracts (tasks, etc.)
    for (const [contractName, contractRouter] of Object.entries(contractMap)) {
      // ts-rest contracts are directly the endpoint objects
      // Iterate through endpoints in each contract (listTasks, createTask, etc.)
      for (const [endpointName, endpoint] of Object.entries(contractRouter)) {
        this.processEndpoint([contractName, endpointName], endpoint, tools)
      }
    }

    return tools
  }

  private static processEndpoint(path: string[], endpoint: any, tools: McpToolDefinition[]) {
    // Only register endpoints with mcp metadata set to true
    if (!endpoint.metadata?.mcp) {
      return
    }

    const toolDefinition = this.createToolDefinition(path, endpoint)
    tools.push(toolDefinition)
    console.log(`📝 Cached MCP tool: ${toolDefinition.name}`)
  }

  private static createToolDefinition(path: string[], endpoint: any): McpToolDefinition {
    const toolName = this.generateToolName(path)
    const inputSchema = this.createInputSchema(endpoint)
    const description = this.generateDescription(path, endpoint)

    return {
      name: toolName,
      description,
      guidance: endpoint.metadata?.guidance,
      inputSchema,
      contractPath: path,
      endpoint,
    }
  }

  private static createInputSchema(endpoint: any) {
    const schema: any = {}

    // Add path parameters
    if (endpoint.pathParams?.shape) {
      Object.assign(schema, endpoint.pathParams.shape)
    }

    // Add body parameters
    if (endpoint.body?.shape) {
      Object.assign(schema, endpoint.body.shape)
    }

    // Add query parameters
    if (endpoint.query?.shape) {
      Object.assign(schema, endpoint.query.shape)
    }

    return schema
  }

  private static generateToolName(path: string[]): string {
    return `${path
      .join("_")
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()}`
  }

  private static generateDescription(path: string[], endpoint: any): string {
    return endpoint.summary || endpoint.description || `${path.join(".")} endpoint`
  }
}
