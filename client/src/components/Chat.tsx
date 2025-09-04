"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import ReactMarkdown from "react-markdown"

export default function Chat({ authHeader, onTasksChanged }: { authHeader: string; onTasksChanged: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const examplePrompts = [
    "Create a high priority task to order more cold brew kegs",
    "Show me all tasks assigned to charlie",
    "Show me all high priority tasks",
    "Mark the first task as completed",
  ]

  const handleSuggestedPrompt = async (prompt: string) => {
    setMessages((prev) => [...prev, { role: "user", content: prompt }])
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, authHeader }),
      })

      const data = await response.json()

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])

      // Always refresh the UI after assistant responds
      onTasksChanged()
    } catch (error) {
      console.error("Failed to send message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, authHeader }),
      })

      const data = await response.json()

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])

      // Always refresh the UI after assistant responds
      onTasksChanged()
    } catch (error) {
      console.error("Failed to send message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="mb-4 flex-1 space-y-3 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4 font-medium">Try asking me to:</p>
              <div className="space-y-2">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="hover:bg-accent mx-auto block w-full max-w-sm cursor-pointer rounded-lg border p-2 text-left text-sm transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] break-words rounded-lg p-3 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <div
                    className={`mb-1 text-xs font-semibold ${
                      msg.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {msg.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="overflow-hidden text-sm">
                    {msg.role === "user" ? (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    ) : (
                      <div className="break-words">
                        <ReactMarkdown
                          components={{
                            // Custom styling for markdown elements
                            p: ({ children }) => <p className="my-2 break-words leading-relaxed">{children}</p>,
                            li: ({ children }) => <li className="my-1 break-words">{children}</li>,
                            ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-4">{children}</ul>,
                            ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-4">{children}</ol>,
                            strong: ({ children }) => <strong className="break-words font-semibold">{children}</strong>,
                            h1: ({ children }) => (
                              <h1 className="mb-2 mt-3 break-words text-base font-bold">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="mb-1 mt-2 break-words text-base font-semibold">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="mb-1 mt-2 break-words text-sm font-semibold">{children}</h3>
                            ),
                            code: ({ children }) => (
                              <code className="break-words rounded bg-gray-100 px-1 py-0.5 text-xs">{children}</code>
                            ),
                            pre: ({ children }) => (
                              <pre className="my-2 overflow-x-auto break-words rounded bg-gray-100 p-2 text-xs">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="mt-4 flex justify-start">
              <div className="bg-muted text-muted-foreground max-w-[80%] rounded-lg p-3">
                <div className="text-muted-foreground mb-1 text-xs font-semibold">Assistant</div>
                <div className="flex items-center gap-2">
                  <div className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"></div>
                  <div
                    className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask me to manage tasks..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
