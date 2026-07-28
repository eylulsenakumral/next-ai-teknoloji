import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"

// ============================================================================
// POST /api/bizimhesap/test
// BizimHesap B2B API bağlantısını test eder
// Body: { token?: string } (eski: apiKey - geriye dönük uyumluluk korundu)
// Gönderilmezse env değeri kullanılır
//
// BizimHesap API:
//   Base URL: https://bizimhesap.com/api/b2b/
//   Auth: Header'da "token" gönderilir
//   Test: /warehouses endpoint'i (parametresiz, en basit)
// ============================================================================
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  let body: { token?: string; apiKey?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body opsiyonel
  }

  // token ve apiKey her ikisi de desteklenir (geriye dönük uyumluluk)
  const apiKey = body.token ?? body.apiKey ?? process.env.BIZIMHESAP_API_KEY ?? ""

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "API Key girilmemiş." },
      { status: 400 }
    )
  }

  // 3 farklı header kombinasyonu dene
  const BIZIMHESAP_KEY = process.env.BIZIMHESAP_API_KEY || ""
  const attempts: Record<string, string>[] = [
    // 1. Sadece token header (PHP paketi böyle kullanıyor)
    { token: apiKey },
    // 2. Key + Token (dökümantasyon böyle gösteriyor)
    { Key: apiKey, token: apiKey },
    // 3. Key (env) + Token kullanıcı değeri
    { Key: BIZIMHESAP_KEY, token: apiKey },
  ]

  for (let i = 0; i < attempts.length; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch("https://bizimhesap.com/api/b2b/warehouses", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...attempts[i],
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json().catch(() => null)
        return NextResponse.json({
          success: true,
          message: `Bağlantı başarılı. (Yöntem ${i + 1})`,
          statusCode: res.status,
          data: data ? { hasData: true } : undefined,
        })
      }

      // Son deneme başarısızsa hata dön
      if (i === attempts.length - 1) {
        const errorText = await res.text().catch(() => "")
        return NextResponse.json({
          success: false,
          error: `API ${res.status} döndürdü. Key/Token doğruluğunu kontrol edin.`,
          detail: errorText.slice(0, 300),
          statusCode: res.status,
        })
      }
    } catch (err) {
      if (i === attempts.length - 1) {
        const isTimeout = err instanceof Error && err.name === "AbortError"
        return NextResponse.json({
          success: false,
          error: isTimeout
            ? "Bağlantı zaman aşımına uğradı (10s)."
            : "Ağ hatası oluştu. BizimHesap sunucusuna erişilemiyor.",
        })
      }
    }
  }

  return NextResponse.json({
    success: false,
    error: "Tüm bağlantı denemeleri başarısız.",
  })
}
