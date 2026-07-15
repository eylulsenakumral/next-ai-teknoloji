const WEBHOOK_URL = process.env.ERROR_WEBHOOK_URL || ""

interface ErrorReport {
  message: string
  stack?: string
  url?: string
  source?: "server" | "client"
  timestamp: string
  extra?: Record<string, unknown>
}

export async function reportError(error: unknown, extra?: Record<string, unknown>) {
  if (!WEBHOOK_URL) return

  const report: ErrorReport = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    source: typeof window !== "undefined" ? "client" : "server",
    timestamp: new Date().toISOString(),
    extra,
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    })
  } catch {
    // webhook itself failed — silent
  }
}
