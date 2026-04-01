import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// ============================================================================
// POST /api/admin/llm/test
// Hem OpenAI hem Anthropic uyumlu chat completion çağrısı
// Endpoint URL'sine göre otomatik format seçer
// ============================================================================
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  let body: {
    endpoint?: string
    apiKey?: string
    model?: string
    message?: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  }

  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const {
    endpoint,
    apiKey,
    model,
    message,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 1024,
  } = body

  if (!endpoint || typeof endpoint !== "string") {
    return NextResponse.json({ error: "Endpoint URL gerekli." }, { status: 400 })
  }
  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json({ error: "API Key gerekli." }, { status: 400 })
  }
  if (!model || typeof model !== "string") {
    return NextResponse.json({ error: "Model seçimi gerekli." }, { status: 400 })
  }
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Test mesajı gerekli." }, { status: 400 })
  }

  const baseUrl = endpoint.replace(/\/$/, "")
  const isAnthropic = baseUrl.includes("anthropic.com") || baseUrl.includes("anthropic")

  try {
    let responseContent: string | null = null

    if (isAnthropic) {
      // ---- ANTHROPIC API FORMAT ----
      const chatUrl = baseUrl.endsWith("/messages")
        ? baseUrl
        : `${baseUrl}/messages`

      const requestBody: Record<string, unknown> = {
        model,
        max_tokens: Math.min(Math.max(maxTokens, 1), 32768),
        temperature: Math.min(Math.max(temperature, 0), 1), // Anthropic max 1.0
        messages: [{ role: "user", content: message }],
      }

      if (systemPrompt?.trim()) {
        requestBody.system = systemPrompt.trim()
      }

      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30_000),
      })

      const data = (await response.json()) as {
        content?: Array<{ type: string; text: string }>
        error?: { message?: string; type?: string }
      }

      if (!response.ok) {
        const errMsg =
          data?.error?.message ??
          `Anthropic API hatası: ${response.status} ${response.statusText}`
        return NextResponse.json({ error: errMsg }, { status: 400 })
      }

      responseContent =
        data?.content?.find((c) => c.type === "text")?.text ?? null
    } else {
      // ---- OPENAI UYUMLU API FORMAT ----
      const chatUrl = baseUrl.endsWith("/chat/completions")
        ? baseUrl
        : `${baseUrl}/chat/completions`

      const messages: Array<{ role: string; content: string }> = []
      if (systemPrompt?.trim()) {
        messages.push({ role: "system", content: systemPrompt.trim() })
      }
      messages.push({ role: "user", content: message })

      const requestBody = {
        model,
        messages,
        temperature: Math.min(Math.max(temperature, 0), 2),
        max_tokens: Math.min(Math.max(maxTokens, 1), 32768),
      }

      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30_000),
      })

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>
        error?: { message?: string }
      }

      if (!response.ok) {
        const errMsg =
          data?.error?.message ??
          `API hatası: ${response.status} ${response.statusText}`
        return NextResponse.json({ error: errMsg }, { status: 400 })
      }

      responseContent = data?.choices?.[0]?.message?.content ?? null
    }

    if (!responseContent) {
      return NextResponse.json(
        { error: "Model boş yanıt döndü." },
        { status: 400 }
      )
    }

    return NextResponse.json({ response: responseContent })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        {
          error:
            "Yanıt zaman aşımına uğradı (30s). Model çok yavaş olabilir.",
        },
        { status: 408 }
      )
    }
    const msg = error instanceof Error ? error.message : "Bilinmeyen hata."
    return NextResponse.json(
      { error: `İstek başarısız: ${msg}` },
      { status: 500 }
    )
  }
}
