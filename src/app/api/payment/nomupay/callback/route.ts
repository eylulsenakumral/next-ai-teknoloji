import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4040"

// 303 See Other redirect — forces browser to use GET (prevents 405 on POST→redirect)
function seeOther(url: string) {
  return NextResponse.redirect(url, { status: 303 })
}

// Step 3: NomuPay calls this URL with POST form-data after payment
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData() as unknown as FormData
    const statusCode = formData.get("StatusCode") as string
    const orderId = formData.get("OrderId") as string
    const mpay = formData.get("MPAY") as string
    const maskedCCNo = formData.get("MaskedCCNo") as string
    const resultCode = formData.get("ResultCode") as string
    const resultMessage = formData.get("ResultMessage") as string
    const amount = formData.get("Price") as string

    console.log("[NOMUPAY CALLBACK POST]", {
      statusCode, orderId, mpay, maskedCCNo, resultCode, resultMessage, amount,
    })

    if (statusCode === "0" && mpay) {
      // Ödeme başarılı
      const isOnlinePayment = mpay.startsWith("ODEME:")

      if (isOnlinePayment) {
        // Online ödeme — cari hesaba PAYMENT olarak işle
        try {
          const customerId = mpay.split(":")[1] // MPAY formatı: ODEME:{customerId}:{timestamp}
          if (customerId) {
            const customer = await prisma.customer.findFirst({
              where: { id: customerId, deletedAt: null },
            })
            if (customer) {
              const paymentAmount = amount ? Math.abs(parseFloat(amount) / 100) : 0
              const newBalance = Number(customer.balance) - paymentAmount

              await prisma.accountTransaction.create({
                data: {
                  customerId: customer.id,
                  type: "PAYMENT",
                  amount: new Prisma.Decimal(-paymentAmount),
                  balanceAfter: new Prisma.Decimal(newBalance),
                  currency: "TRY",
                  referenceType: "NOMUPAY",
                  referenceId: orderId || mpay,
                  description: `Online Ödeme${maskedCCNo ? ` (${maskedCCNo})` : ""}`,
                  notes: `NomuPay OrderId: ${orderId}`,
                },
              })

              await prisma.customer.update({
                where: { id: customer.id },
                data: { balance: new Prisma.Decimal(newBalance) },
              })

              console.log("[NOMUPAY] Online payment recorded for customer:", customerId, "Amount:", paymentAmount)
            }
          }
        } catch (dbErr) {
          console.error("[NOMUPAY] Online payment DB error:", dbErr)
        }
      } else {
        // Sipariş ödemesi — order'ı güncelle
        try {
          const order = await prisma.order.findFirst({
            where: { orderNumber: mpay, deletedAt: null },
          })
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: "PAID",
                status: "CONFIRMED",
                adminNotes: `NomuPay OrderId: ${orderId}, CC: ${maskedCCNo}`,
              },
            })

            // Sipariş ödemesini de cari hesaba işle
            const paymentAmount = Number(order.grandTotal)
            const customer = await prisma.customer.findFirst({
              where: { id: order.customerId, deletedAt: null },
            })
            if (customer) {
              const newBalance = Number(customer.balance) - paymentAmount
              await prisma.accountTransaction.create({
                data: {
                  customerId: customer.id,
                  type: "PAYMENT",
                  amount: new Prisma.Decimal(-paymentAmount),
                  balanceAfter: new Prisma.Decimal(newBalance),
                  currency: "TRY",
                  referenceType: "ORDER",
                  referenceId: order.id,
                  description: `Sipariş Ödemesi (${mpay})${maskedCCNo ? ` - ${maskedCCNo}` : ""}`,
                  notes: `NomuPay OrderId: ${orderId}`,
                },
              })
              await prisma.customer.update({
                where: { id: customer.id },
                data: { balance: new Prisma.Decimal(newBalance) },
              })
            }

            console.log("[NOMUPAY] Order updated:", mpay, "-> PAID/CONFIRMED")
          } else {
            console.warn("[NOMUPAY] Order not found for MPAY:", mpay)
          }
        } catch (dbErr) {
          console.error("[NOMUPAY] DB update error:", dbErr)
        }
      }

      return seeOther(
        new URL(`/sepet/odeme/sonuc?status=success&order=${encodeURIComponent(mpay)}`, APP_URL).toString()
      )
    }

    // Payment failed
    if (mpay) {
      const isOnlinePayment = mpay.startsWith("ODEME:")
      if (!isOnlinePayment) {
        try {
          const order = await prisma.order.findFirst({
            where: { orderNumber: mpay, deletedAt: null },
          })
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                adminNotes: `NomuPay failed: ${resultMessage}`,
              },
            })
          }
        } catch (dbErr) {
          console.error("[NOMUPAY] DB update error:", dbErr)
        }
      }
    }

    return seeOther(
      new URL(`/sepet/odeme/sonuc?status=error&msg=${encodeURIComponent(resultMessage || "Ödeme başarısız")}`, APP_URL).toString()
    )
  } catch (error) {
    console.error("Nomupay callback error:", error)
    return seeOther(
      new URL("/sepet/odeme/sonuc?status=error&msg=İşlem+hata", APP_URL).toString()
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "error"
  const msg = searchParams.get("msg") || ""
  const order = searchParams.get("order") || ""
  const mpay = searchParams.get("mpay") || ""
  const amountParam = searchParams.get("amount") || ""

  const ref = order || mpay
  console.log("[NOMUPAY CALLBACK GET]", { status, order, mpay, amountParam, msg })

  // Başarılı ödemeyi işle — cari hesaba yaz
  if (status === "success" && ref) {
    const isOnlinePayment = ref.startsWith("ODEME:")

    try {
      if (isOnlinePayment && amountParam) {
        // Online ödeme — cari hesaba PAYMENT olarak işle
        const customerId = ref.split(":")[1]
        const paymentAmount = parseFloat(amountParam)

        if (customerId && paymentAmount > 0) {
          const customer = await prisma.customer.findFirst({
            where: { id: customerId, deletedAt: null },
          })
          if (customer) {
            const newBalance = Math.round((Number(customer.balance) - paymentAmount) * 100) / 100

            await prisma.$transaction([
              prisma.accountTransaction.create({
                data: {
                  customerId: customer.id,
                  type: "PAYMENT",
                  amount: new Prisma.Decimal(-paymentAmount),
                  balanceAfter: new Prisma.Decimal(newBalance),
                  currency: "TRY",
                  referenceType: "NOMUPAY",
                  referenceId: ref,
                  description: `Online Ödeme - ${paymentAmount.toFixed(2)} TL`,
                },
              }),
              prisma.customer.update({
                where: { id: customer.id },
                data: { balance: new Prisma.Decimal(newBalance) },
              }),
            ])
            console.log("[NOMUPAY GET] Online payment recorded:", paymentAmount, "TL for customer:", customerId)
          }
        }
      } else {
        // Sipariş ödemesi — order'ı güncelle ve cariye işle
        const orderRow = await prisma.order.findFirst({
          where: { orderNumber: order, deletedAt: null },
        })
        if (orderRow && orderRow.paymentStatus !== "PAID") {
          const paymentAmount = Number(orderRow.grandTotal)
          const customer = await prisma.customer.findFirst({
            where: { id: orderRow.customerId, deletedAt: null },
          })

          if (customer) {
            // TCMB kurundan TL karşılık
            const rateRes = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml")
            const rateXml = await rateRes.text()
            const rateMatch = rateXml.match(/CurrencyCode="USD"[\s\S]*?<ForexSelling>([\d.,]+)<\/ForexSelling>/)
            const usdTry = rateMatch ? parseFloat(rateMatch[1].replace(",", ".")) : 38
            const paymentTL = Math.round(paymentAmount * usdTry * 100) / 100

            const newBalance = Math.round((Number(customer.balance) - paymentTL) * 100) / 100

            await prisma.$transaction([
              prisma.order.update({
                where: { id: orderRow.id },
                data: {
                  paymentStatus: "PAID",
                  status: "CONFIRMED",
                  adminNotes: `NomuPay ödeme (GET) - ${order}`,
                },
              }),
              prisma.accountTransaction.create({
                data: {
                  customerId: customer.id,
                  type: "PAYMENT",
                  amount: new Prisma.Decimal(-paymentTL),
                  balanceAfter: new Prisma.Decimal(newBalance),
                  currency: "TRY",
                  referenceType: "ORDER",
                  referenceId: orderRow.id,
                  description: `Sipariş ödemesi - ${order} (${paymentAmount} USD × ${usdTry})`,
                  notes: "NomuPay online ödeme",
                },
              }),
              prisma.customer.update({
                where: { id: customer.id },
                data: { balance: new Prisma.Decimal(newBalance) },
              }),
            ])
            console.log("[NOMUPAY GET] Order payment recorded:", order, paymentTL, "TL")
          }
        }
      }
    } catch (dbErr) {
      console.error("[NOMUPAY GET] Payment processing error:", dbErr)
    }
  }

  if (status === "success") {
    return NextResponse.redirect(
      new URL(`/sepet/odeme/sonuc?status=success&order=${order}`, APP_URL)
    )
  }
  return NextResponse.redirect(
    new URL(`/sepet/odeme/sonuc?status=error&msg=${msg}`, APP_URL)
  )
}
