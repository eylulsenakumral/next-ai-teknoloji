import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// ============================================================================
// POST /api/admin/llm/models
// Hem OpenAI hem Anthropic uyumlu endpoint'ten model listesi çeker
// Body: { endpoint: string, apiKey: string }
// ============================================================================
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  let body: { endpoint?: string; apiKey?: string }
  try {
    body = (await req.json()) as { endpoint?: string; apiKey?: string }
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi." },
      { status: 400 }
    )
  }

  const { endpoint, apiKey } = body

  if (!endpoint || typeof endpoint !== "string") {
    return NextResponse.json(
      { error: "Endpoint URL gerekli." },
      { status: 400 }
    )
  }
  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json(
      { error: "API Key gerekli." },
      { status: 400 }
    )
  }

  const baseUrl = endpoint.replace(/\/$/, "")
  const isAnthropic =
    baseUrl.includes("anthropic.com") || baseUrl.includes("anthropic")

  try {
    if (isAnthropic) {
      // ---- ANTHROPIC: /models endpoint ----
      const modelsUrl = baseUrl.endsWith("/models")
        ? baseUrl
        : `${baseUrl}/models`

      const response = await fetch(modelsUrl, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10_000),
      })

      if (response.ok) {
        const data = (await response.json()) as {
          data?: Array<{ id: string; display_name?: string }>
        }
        const models = (data?.data ?? []).map((m) => ({
          id: m.id,
          owned_by: "anthropic",
        }))
        return NextResponse.json({ models })
      }

      // Anthropic /models endpoint yoksa bilinen modelleri dön
      return NextResponse.json({
        models: [
          { id: "claude-sonnet-4-20250514", owned_by: "anthropic" },
          { id: "claude-haiku-4-20250514", owned_by: "anthropic" },
          { id: "claude-opus-4-20250514", owned_by: "anthropic" },
          { id: "claude-3-5-sonnet-20241022", owned_by: "anthropic" },
          { id: "claude-3-5-haiku-20241022", owned_by: "anthropic" },
          { id: "claude-3-opus-20240229", owned_by: "anthropic" },
        ],
      })
    }

    // ---- OPENAI UYUMLU ----
    const modelsUrl = baseUrl.endsWith("/models")
      ? baseUrl
      : `${baseUrl}/models`

    const response = await fetch(modelsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      return NextResponse.json(
        {
          error: `API hatası: ${response.status} ${response.statusText}. ${text.slice(0, 200)}`,
        },
        { status: 400 }
      )
    }

    const data = (await response.json()) as
      | { data: Array<{ id: string; owned_by?: string }> }
      | Array<{ id: string; owned_by?: string }>

    let models: Array<{ id: string; owned_by?: string }>
    if (Array.isArray(data)) {
      models = data
    } else if (data && Array.isArray(data.data)) {
      models = data.data
    } else {
      return NextResponse.json(
        { error: "Beklenen model formatı alınamadı." },
        { status: 400 }
      )
    }

    // Embedding, whisper, tts, dall-e gibi modelleri filtrele
    const chatModels = models.filter((m) => {
      const id = m.id.toLowerCase()
      return (
        !id.includes("embedding") &&
        !id.includes("whisper") &&
        !id.includes("tts") &&
        !id.includes("dall-e") &&
        !id.includes("clip") &&
        !id.includes("text-davinci-edit") &&
        !id.includes("code-davinci")
      )
    })

    return NextResponse.json({ models: chatModels })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Bağlantı zaman aşımına uğradı (10s)." },
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
