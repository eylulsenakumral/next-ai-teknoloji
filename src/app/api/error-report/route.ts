import { NextRequest, NextResponse } from "next/server"

const WEBHOOK_URL = process.env.ERROR_WEBHOOK_URL || ""

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const report = {
      ...body,
      env: process.env.NODE_ENV,
      app: "nexadepo.com",
    }

    if (WEBHOOK_URL) {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // never fail on error reporting
  }
}
