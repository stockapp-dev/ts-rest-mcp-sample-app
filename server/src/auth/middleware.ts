import { NextFunction, Request, Response } from "express"

export interface AuthRequest extends Request {
  userId?: string
  username?: string
}

// Simple Basic Auth for demonstration
// In production, use proper authentication like JWT, OAuth, etc.
export async function checkAuth(
  req: AuthRequest,
  res?: Response,
  next?: NextFunction
): Promise<{ status: 401; body: { code: string; message: string } } | null> {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    const error = {
      status: 401 as const,
      body: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header",
      },
    }

    if (res && next) {
      res.status(401).json(error.body)
      return null
    }
    return error
  }

  try {
    // Decode Basic Auth
    const base64Credentials = authHeader.split(" ")[1]
    const credentials = Buffer.from(base64Credentials, "base64").toString("ascii")
    const [username, password] = credentials.split(":")

    // Simple hardcoded check for demo
    // In production, verify against database
    if (username === "demo" && password === "demo123") {
      req.userId = "user-123" // Mock user ID
      req.username = username

      if (next) {
        next()
      }
      return null
    }

    const error = {
      status: 401 as const,
      body: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid username or password",
      },
    }

    if (res && next) {
      res.status(401).json(error.body)
      return null
    }
    return error
  } catch (error) {
    const errorResponse = {
      status: 401 as const,
      body: {
        code: "AUTH_ERROR",
        message: "Authentication failed",
      },
    }

    if (res && next) {
      res.status(401).json(errorResponse.body)
      return null
    }
    return errorResponse
  }
}

// Express middleware wrapper
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  checkAuth(req, res, next)
}
