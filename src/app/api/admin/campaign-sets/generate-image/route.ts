import { NextRequest, NextResponse } from "next/server"
import { getAdminSession, requireAdminSession } from "@/lib/auth-helpers"
import { minio, ensureBucket, buildMinioUrl } from "@/lib/minio"

const OMNI_KEY = process.env.OMNIROUTE_API_KEY || "sk-45a7dc0fe4785ca8-pd7u9d-18c8f9bb"
const OMNI_BASE = process.env.OMNIROUTE_BASE_URL || "http://192.168.5.249:20128"

// ---------------------------------------------------------------------------
// POST /api/admin/campaign-sets/generate-image
// Body: { name: string, products: { name: string; quantity: number }[] }
// Returns: { imageUrl: string }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const authError = requireAdminSession(session)
  if (authError) return authError

  try {
    const { name, products } = await req.json()
    if (!name || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Set adı ve ürünler gerekli." }, { status: 400 })
    }

    // 1) LLM ile görsel prompt oluştur
    const productList = products
      .map((p: { name: string; quantity: number }) => `- ${p.name}${p.quantity > 1 ? ` (x${p.quantity})` : ""}`)
      .join("\n")

    const promptRes = await fetch(`${OMNI_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OMNI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "cc/claude-sonnet-4-5-20250929",
        max_tokens: 300,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "You are a professional product photography prompt engineer. Generate a single detailed image generation prompt for a promotional banner image. The banner should showcase the products listed below as a cohesive set/bundle deal. Style: modern, clean, professional e-commerce banner with soft lighting, white/light gradient background, product placement that looks premium. Include the campaign name as elegant typography overlay. Output ONLY the prompt text, nothing else. Keep it under 200 words. Use English.",
          },
          {
            role: "user",
            content: `Campaign/Bundle name: "${name}"\n\nProducts in the bundle:\n${productList}`,
          },
        ],
      }),
    })

    const promptData = await promptRes.json()
    const imagePrompt = promptData?.choices?.[0]?.message?.content?.trim()

    if (!imagePrompt) {
      return NextResponse.json({ error: "Prompt oluşturulamadı." }, { status: 500 })
    }

    // 2) Görsel oluştur
    const imgRes = await fetch(`${OMNI_BASE}/v1/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OMNI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "medium",
      }),
    })

    const imgData = await imgRes.json()
    const b64 = imgData?.data?.[0]?.b64_json
    const url = imgData?.data?.[0]?.url

    if (url) {
      return NextResponse.json({ imageUrl: url })
    }

    if (b64) {
      // b64_json → Minio'ya yükle
      const buffer = Buffer.from(b64, "base64")
      const objectKey = `campaign-sets/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
      await ensureBucket()
      await minio.putObject("nextai-assets", objectKey, buffer, buffer.length, {
        "Content-Type": "image/png",
      })
      const imageUrl = buildMinioUrl(objectKey)
      return NextResponse.json({ imageUrl, imagePrompt })
    }

    return NextResponse.json({ error: "Görsel oluşturulamadı.", details: imgData }, { status: 500 })
  } catch (err) {
    console.error("[generate-image]", err)
    return NextResponse.json({ error: "Görsel oluşturma hatası." }, { status: 500 })
  }
}
