export class MCPError extends Error {
  constructor(
    public readonly type: "USER" | "SYSTEM",
    public readonly message: string,
    public readonly status?: number
  ) {
    super(message)
    this.name = "MCPError"
  }
}
