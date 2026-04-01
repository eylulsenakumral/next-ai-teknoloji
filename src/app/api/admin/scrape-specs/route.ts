import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/db"

// ============================================================================
// POST /api/admin/scrape-specs
// URL'den ürün teknik özelliklerini ve görsellerini LLM ile çıkarır
// ============================================================================
export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  let body: { url?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 })
  }

  const { url } = body

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL gerekli." }, { status: 400 })
  }

  // URL validate
  let baseUrl: string
  try {
    const parsed = new URL(url)
    baseUrl = parsed.origin
  } catch {
    return NextResponse.json({ error: "Geçersiz URL formatı." }, { status: 400 })
  }

  // LLM config'i DB'den al (ayrı key'ler olarak kaydediliyor)
  const [endpointSetting, apiKeySetting, modelSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "llm.endpoint" } }),
    prisma.setting.findUnique({ where: { key: "llm.api_key" } }),
    prisma.setting.findUnique({ where: { key: "llm.model" } }),
  ])

  const endpoint = endpointSetting?.value as string | undefined
  const apiKey = apiKeySetting?.value as string | undefined
  const model = modelSetting?.value as string | undefined

  if (!endpoint || !apiKey || !model) {
    return NextResponse.json(
      { error: "LLM yapılandırması bulunamadı. Admin > Entegrasyonlar'dan ayarlayın." },
      { status: 400 }
    )
  }

  try {
    // 1. URL'den içeriği çek
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!fetchResponse.ok) {
      return NextResponse.json(
        { error: `Sayfa alınamadı: ${fetchResponse.status} ${fetchResponse.statusText}` },
        { status: 400 }
      )
    }

    const contentType = fetchResponse.headers.get("content-type") || ""
    let pageContent: string
    let rawHtml: string | null = null

    if (contentType.includes("text/html")) {
      rawHtml = await fetchResponse.text()
      pageContent = rawHtml
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/\s+/g, " ")
        .substring(0, 15000)
    } else {
      pageContent = await fetchResponse.text()
      pageContent = pageContent.substring(0, 15000)
    }

    // 2. HTML'den görselleri çıkar
    const extractedImages: string[] = []
    if (rawHtml) {
      // Ürün görselleri için yaygın pattern'ler
      const imgPatterns = [
        // data-src veya data-lazy-src (lazy loading)
        /(?:data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)["']/gi,
        // src attribute
        /src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"']*)["']/gi,
        // srcset
        /srcset=["']([^"']+\.(?:jpg|jpeg|png|gif|webp)[^"' ]*)/gi,
        // JSON içindeki image URL'leri
        /"(?:image|img|photo|picture|thumbnail)":\s*"([^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/gi,
      ]

      const foundUrls = new Set<string>()

      for (const pattern of imgPatterns) {
        let match
        while ((match = pattern.exec(rawHtml)) !== null) {
          let imgUrl = match[1]

          // Relative URL'leri absolute yap
          if (imgUrl.startsWith("//")) {
            imgUrl = "https:" + imgUrl
          } else if (imgUrl.startsWith("/")) {
            imgUrl = baseUrl + imgUrl
          } else if (!imgUrl.startsWith("http")) {
            continue
          }

          // Logolar, iconlar, placeholder'ları atla
          if (
            imgUrl.includes("logo") ||
            imgUrl.includes("icon") ||
            imgUrl.includes("avatar") ||
            imgUrl.includes("placeholder") ||
            imgUrl.includes("banner") ||
            imgUrl.includes("thumb") ||
            imgUrl.includes("sprite") ||
            imgUrl.includes("data:image") ||
            imgUrl.includes(".svg")
          ) {
            continue
          }

          // Boyut kontrolü - küçük görselleri atla
          if (!foundUrls.has(imgUrl)) {
            foundUrls.add(imgUrl)
            if (extractedImages.length < 5) {
              extractedImages.push(imgUrl)
            }
          }
        }
      }
    }

    // 3. LLM ile özellikleri çıkar
    const systemPrompt = `Sen bir ürün teknik özellik çıkarıcısısın. Kullanıcı sana bir web sayfasının içeriğini verecek.
Senin görevin bu sayfada geçen ÜRÜN TEKNİK ÖZELLİKLERİNİ çıkarmak.

Kurallar:
- SADECE teknik özellikleri çıkar (işlemci, ram, ekran boyutu, çözünürlük, pil ömrü, ağırlık, boyutlar vb.)
- Reklam, menü, footer, iletişim bilgisi gibi şeyleri YOK SAY
- Özellik adı ve değerini net şekilde ayır
- Türkçe veya İngilizce özellik adlarını olduğu gibi bırak
- Değerleri kısa ve öz tut
- Eğer teknik özellik tablosu veya listesi varsa onu önceliklendir

Çıktı formatı SADECE JSON olmalı, başka hiçbir şey yazma:
{"specs": {"Özellik Adı": "Değer", "Başka Özellik": "Değer2"}}

Özellik bulunamazsa: {"specs": {}}`

    const userMessage = `Bu sayfanın içeriğinden ürün teknik özelliklerini çıkar:

${pageContent}

JSON formatında özellikleri döndür.`

    // OpenAI uyumlu API çağrısı
    const chatUrl = endpoint.replace(/\/$/, "").endsWith("/chat/completions")
      ? endpoint.replace(/\/$/, "")
      : `${endpoint.replace(/\/$/, "")}/chat/completions`

    const llmResponse = await fetch(chatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    const llmData = (await llmResponse.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>
      error?: { message?: string }
    }

    if (!llmResponse.ok) {
      const errMsg = llmData?.error?.message ?? `LLM API hatası: ${llmResponse.status}`
      return NextResponse.json({ error: errMsg }, { status: 400 })
    }

    const llmContent = llmData?.choices?.[0]?.message?.content

    if (!llmContent) {
      return NextResponse.json({ error: "LLM boş yanıt döndü." }, { status: 400 })
    }

    // JSON'u parse et
    let specs: Record<string, string> = {}

    try {
      let jsonStr = llmContent
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim()

      const parsed = JSON.parse(jsonStr)
      if (parsed.specs && typeof parsed.specs === "object") {
        specs = parsed.specs
      } else if (typeof parsed === "object") {
        specs = parsed
      }
    } catch {
      const lines = llmContent.split("\n")
      for (const line of lines) {
        const match = line.match(/["']?([^"':]+)["']?\s*[:\-=]\s*["']?([^"'\n]+)["']?/)
        if (match && match[1] && match[2]) {
          specs[match[1].trim()] = match[2].trim()
        }
      }
    }

    // Boş değerleri temizle
    const cleanSpecs: Record<string, string> = {}
    for (const [key, value] of Object.entries(specs)) {
      if (key.trim() && value && String(value).trim()) {
        cleanSpecs[key.trim()] = String(value).trim()
      }
    }

    return NextResponse.json({
      success: true,
      specs: cleanSpecs,
      images: extractedImages,
      source: url,
      extractedCount: Object.keys(cleanSpecs).length,
      imageCount: extractedImages.length,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "İstek zaman aşımına uğradı. Sayfa çok yavaş olabilir." },
        { status: 408 }
      )
    }
    const msg = error instanceof Error ? error.message : "Bilinmeyen hata."
    return NextResponse.json({ error: `Scrape başarısız: ${msg}` }, { status: 500 })
  }
}
