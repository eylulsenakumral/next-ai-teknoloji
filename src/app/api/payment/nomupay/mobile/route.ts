import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

const NOMUPAY_URL = process.env.NOMUPAY_API_URL || "https://test.nomupay.com.tr/SGate/Gate"
const NOMUPAY_USER = process.env.NOMUPAY_API_USER || ""
const NOMUPAY_PIN = process.env.NOMUPAY_API_PIN || ""

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
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
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
    where: { id: orderId, customerId: session.user.id, deletedAt: null },
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

    const mpay = `ODEME:${order.customerId}:${Date.now()}`
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
  <ErrorURL>${appUrl}/api/payment/nomupay/callback?status=error&mpay=${encodeURIComponent(mpay)}</ErrorURL>
  <SuccessURL>${appUrl}/api/payment/nomupay/callback?status=success&mpay=${encodeURIComponent(mpay)}&amount=${amountTRY}&orderId=${order.id}</SuccessURL>
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

    const redirectMatch = responseText.match(/<Item\s+Key="RedirectUrl"\s+Value="([^"]+)"/i)
      || responseText.match(/<Item\s+Key="ReturnUrl"\s+Value="([^"]+)"/i)
    const statusMatch = responseText.match(/<Item\s+Key="StatusCode"\s+Value="([^"]+)"/i)
    const msgMatch = responseText.match(/<Item\s+Key="ResultMessage"\s+Value="([^"]+)"/i)

    const statusCode = statusMatch?.[1] ?? ""
    const paymentUrl = redirectMatch?.[1] ?? ""

    if (statusCode === "0" && paymentUrl) {
      return NextResponse.json({ paymentUrl })
    }

    const resultMessage = msgMatch?.[1] ?? "Ödeme başlatılamadı"
    return NextResponse.json({ error: resultMessage }, { status: 400 })
  } catch (err) {
    console.error("[NOMUPAY/MOBILE]", err)
    return NextResponse.json({ error: "Ödeme servisi ile bağlantı kurulamadı." }, { status: 500 })
  }
}
