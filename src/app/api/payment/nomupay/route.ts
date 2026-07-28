import { NextRequest, NextResponse } from "next/server"

const NOMUPAY_URL = process.env.NOMUPAY_API_URL || "https://test.nomupay.com.tr/SGate/Gate"
const NOMUPAY_USER = process.env.NOMUPAY_API_USER || ""
const NOMUPAY_PIN = process.env.NOMUPAY_API_PIN || ""

function parseXmlResponse(xml: string) {
  const itemVal = (key: string) => {
    const m = xml.match(new RegExp(`<Item\\s+Key="${key}"\\s+Value="([^"]*)"`, "i"))
    return m ? m[1].trim() : ""
  }
  return {
    statusCode: itemVal("StatusCode"),
    resultCode: itemVal("ResultCode"),
    resultMessage: itemVal("ResultMessage"),
    // NomuPay docs say "RedirectUrl" but also seen "ReturnUrl" — handle both
    redirectUrl: itemVal("RedirectUrl") || itemVal("ReturnUrl"),
    orderId: itemVal("OrderId"),
    maskedCCNo: itemVal("MaskedCCNo"),
    mpay: itemVal("MPAY"),
  }
}

// Step 1: Create hosted payment page ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      amount,
      mpay,
      currency = "TRY",
      description = "Siparis odemesi",
      paymentContent = "Next AI Teknoloji - Siparis Odemesi",
      customerName,
      customerSurname,
      customerEmail,
    } = body

    if (!amount || !mpay) {
      return NextResponse.json({ error: "Eksik alanlar var" }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4040"
    const priceKurus = Math.round(amount * 100)

    const xml = `<?xml version="1.0" encoding="ISO-8859-9"?>
<WIRECARD>
  <ServiceType>WDTicket</ServiceType>
  <OperationType>Sale3DSURLProxy</OperationType>
  <Token>
    <UserCode>${NOMUPAY_USER}</UserCode>
    <Pin>${NOMUPAY_PIN}</Pin>
  </Token>
  <Price>${priceKurus}</Price>
  <CurrencyCode>${currency}</CurrencyCode>
  <MPAY>${mpay}</MPAY>
  <ErrorURL>${appUrl}/api/payment/nomupay/callback</ErrorURL>
  <SuccessURL>${appUrl}/api/payment/nomupay/callback</SuccessURL>
  <Description>${description}</Description>
  <PaymentContent>${paymentContent}</PaymentContent>
  <CustomerInfo>
    <CustomerName>${customerName || ""}</CustomerName>
    <CustomerSurname>${customerSurname || ""}</CustomerSurname>
    <CustomerEmail>${customerEmail || ""}</CustomerEmail>
  </CustomerInfo>
  <Language>TR</Language>
</WIRECARD>`

    console.log("[NOMUPAY] Creating ticket - MPAY:", mpay, "Price:", priceKurus)

    const nomupayRes = await fetch(NOMUPAY_URL, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: xml,
    })

    const responseText = await nomupayRes.text()

    const parsed = parseXmlResponse(responseText)

    if (parsed.statusCode === "0" && parsed.redirectUrl) {
      return NextResponse.json({
        success: true,
        returnUrl: parsed.redirectUrl,
        ...parsed,
      })
    }

    // Hassas veri (PIN/XML/ham yanıt) cliente sızdırma — parsed alanlar yeterli.
    return NextResponse.json({
      success: false,
      ...parsed,
    })
  } catch (error) {
    console.error("Nomupay ticket error:", error)
    return NextResponse.json(
      { error: "Odeme baslatma sirasinda hata olustu" },
      { status: 500 }
    )
  }
}
