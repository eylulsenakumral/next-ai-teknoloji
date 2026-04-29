import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { decode } from "next-auth/jwt"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

const NOMUPAY_URL = process.env.NOMUPAY_API_URL || "https://test.nomupay.com.tr/SGate/Gate"
const NOMUPAY_USER = process.env.NOMUPAY_API_USER || ""
const NOMUPAY_PIN = process.env.NOMUPAY_API_PIN || ""

function parseXmlResponse(xml: string) {
  const itemVal = (key: string) => {
    const match = xml.match(new RegExp(`<Item\\s+[^>]*Key=["']${key}["'][^>]*Value=["']([^"']*)["']`, "i"))
    return match ? match[1].trim().replace(/&amp;/g, "&") : ""
  }

  return {
    statusCode: itemVal("StatusCode"),
    resultCode: itemVal("ResultCode"),
    resultMessage: itemVal("ResultMessage"),
    paymentUrl:
      itemVal("RedirectUrl") ||
      itemVal("RedirectURL") ||
      itemVal("ReturnUrl") ||
      itemVal("ReturnURL"),
    orderId: itemVal("OrderId"),
    maskedCCNo: itemVal("MaskedCCNo"),
    mpay: itemVal("MPAY"),
  }
}

async function getUsdTryRate(): Promise<number> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 3600 },
    })
    const xml = await res.text()
    const match = xml.match(/CurrencyCode="USD"[\s\S]*?<ForexSelling>([\d.,]+)<\/ForexSelling>/)
    if (match) return parseFloat(match[1].replace(",", "."))
  } catch {}
  return 38
}

export async function POST(request: NextRequest) {
  let customerId: string | null = null
  const session = await getServerSession(authOptions)

  if (session?.user?.id) {
    customerId = session.user.id
  }

  if (!customerId) {
    const bearer = request.headers.get("authorization")?.replace("Bearer ", "") ?? null
    if (bearer && process.env.NEXTAUTH_SECRET) {
      try {
        const decoded = await decode({ secret: process.env.NEXTAUTH_SECRET, token: bearer })
        const id = (decoded?.sub ?? decoded?.id) as string | undefined
        if (id) customerId = id
      } catch {}
    }
  }

  if (!customerId) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 })
  }

  let orderId: string
  try {
    const body = await request.json()
    orderId = body.orderId
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  if (!orderId) {
    return NextResponse.json({ error: "orderId zorunludur." }, { status: 400 })
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId, deletedAt: null },
    include: { customer: true },
  })

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
  }

  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Bu sipariş zaten ödenmiş." }, { status: 400 })
  }

  try {
    const usdTryRate = await getUsdTryRate()
    const amountTRY = Math.round(Number(order.grandTotal) * usdTryRate * 100) / 100
    const priceKurus = Math.round(amountTRY * 100)

    const mpay = order.orderNumber
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexadepo.com"

    const contactName = order.customer.contactName ?? ""
    const nameParts = contactName.trim().split(" ")
    const customerName = nameParts.slice(0, -1).join(" ") || contactName
    const customerSurname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
    const customerEmail = order.customer.email ?? ""

    const xml = `<?xml version="1.0" encoding="ISO-8859-9"?>
<WIRECARD>
  <ServiceType>WDTicket</ServiceType>
  <OperationType>Sale3DSURLProxy</OperationType>
  <Token>
    <UserCode>${NOMUPAY_USER}</UserCode>
    <Pin>${NOMUPAY_PIN}</Pin>
  </Token>
  <Price>${priceKurus}</Price>
  <CurrencyCode>TRY</CurrencyCode>
  <MPAY>${mpay}</MPAY>
  <ErrorURL>${appUrl}/api/payment/nomupay/callback?status=error&order=${encodeURIComponent(mpay)}</ErrorURL>
  <SuccessURL>${appUrl}/api/payment/nomupay/callback?status=success&order=${encodeURIComponent(mpay)}</SuccessURL>
  <Description>Siparis ${order.orderNumber}</Description>
  <PaymentContent>NexaDepo - Siparis ${order.orderNumber}</PaymentContent>
  <CustomerInfo>
    <CustomerName>${customerName}</CustomerName>
    <CustomerSurname>${customerSurname}</CustomerSurname>
    <CustomerEmail>${customerEmail}</CustomerEmail>
  </CustomerInfo>
  <Language>TR</Language>
</WIRECARD>`

    const nomupayRes = await fetch(NOMUPAY_URL, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: xml,
    })

    const responseText = await nomupayRes.text()
    const parsed = parseXmlResponse(responseText)

    if (parsed.statusCode === "0" && parsed.paymentUrl) {
      return NextResponse.json({
        success: true,
        ...parsed,
      })
    }

    return NextResponse.json({
      success: false,
      error: parsed.resultMessage || "Ödeme başlatılamadı",
      ...parsed,
    }, { status: 400 })
  } catch (err) {
    console.error("[NOMUPAY/MOBILE]", err)
    return NextResponse.json({ error: "Ödeme servisi ile bağlantı kurulamadı." }, { status: 500 })
  }
}
