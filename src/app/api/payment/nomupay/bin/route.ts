import { NextRequest, NextResponse } from "next/server"

const NOMUPAY_URL = process.env.NOMUPAY_API_URL || "https://test.nomupay.com.tr/SGate/Gate"
const NOMUPAY_USER = process.env.NOMUPAY_API_USER || ""
const NOMUPAY_PIN = process.env.NOMUPAY_API_PIN || ""

export async function POST(request: NextRequest) {
  try {
    const { bin } = await request.json()

    if (!bin || bin.length < 6) {
      return NextResponse.json({ error: "BIN en az 6 hane olmali" }, { status: 400 })
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MerchantQueriesRequest>
  <ServiceType>MerchantQueries</ServiceType>
  <OperationType>BinQueryOperation</OperationType>
  <Token>
    <UserCode>${NOMUPAY_USER}</UserCode>
    <Pin>${NOMUPAY_PIN}</Pin>
  </Token>
  <Bin>${bin.substring(0, 6)}</Bin>
</MerchantQueriesRequest>`

    const res = await fetch(NOMUPAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `xml=${encodeURIComponent(xml)}`,
    })

    const text = await res.text()

    const tag = (name: string) => {
      const m = text.match(new RegExp(`<${name}>([^<]*)</${name}>`))
      return m ? m[1].trim() : ""
    }

    return NextResponse.json({
      statusCode: tag("StatusCode"),
      resultCode: tag("ResultCode"),
      resultMessage: tag("ResultMessage"),
      installmentEnabled: tag("InstallmentEnabled") === "true",
      cardType: tag("CardType"),
      network: tag("Network"),
      bankName: tag("BankName"),
      isCorporate: tag("IsCorporate") === "true",
    })
  } catch (error) {
    console.error("BIN query error:", error)
    return NextResponse.json({ error: "BIN sorgusu basarisiz" }, { status: 500 })
  }
}
