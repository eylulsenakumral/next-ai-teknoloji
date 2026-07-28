import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { getUsdTryRate } from "@/services/order.service"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4040"

function seeOther(url: string) {
  return NextResponse.redirect(url, { status: 303 })
}

function resultUrl(status: "success" | "error", params: Record<string, string> = {}) {
  const url = new URL("/sepet/odeme/sonuc", APP_URL)
  url.searchParams.set("status", status)

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })

  return url.toString()
}

function parseNomuPayPrice(price: string | null) {
  if (!price) return 0

  const parsedPrice = Number(price)
  if (!Number.isFinite(parsedPrice)) return 0

  return Math.abs(parsedPrice / 100)
}

function paymentReference(orderId: string | null, mpay: string) {
  return orderId || mpay
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const statusCode = String(formData.get("StatusCode") || "")
    const orderId = String(formData.get("OrderId") || "")
    const mpay = String(formData.get("MPAY") || "")
    const maskedCCNo = String(formData.get("MaskedCCNo") || "")
    const resultCode = String(formData.get("ResultCode") || "")
    const resultMessage = String(formData.get("ResultMessage") || "")
    const amount = String(formData.get("Price") || "")

    console.log("NomuPay Callback:", {
      statusCode,
      orderId,
      mpay,
      maskedCCNo,
      resultCode,
      resultMessage,
      amount,
    })

    if (statusCode === "0" && mpay) {
      if (mpay.startsWith("ODEME:")) {
        const customerId = mpay.split(":")[1]
        const paymentAmount = parseNomuPayPrice(amount)
        const referenceId = paymentReference(orderId, mpay)

        if (!customerId || paymentAmount <= 0) {
          return seeOther(resultUrl("error", { msg: "Gecersiz odeme bilgisi" }))
        }

        const existingPayment = await prisma.accountTransaction.findFirst({
          where: { referenceType: "NOMUPAY", referenceId },
          select: { id: true },
        })

        if (existingPayment) {
          return seeOther(resultUrl("success", { order: mpay }))
        }

        await prisma.$transaction(async (tx) => {
          const alreadyProcessed = await tx.accountTransaction.findFirst({
            where: { referenceType: "NOMUPAY", referenceId },
            select: { id: true },
          })

          if (alreadyProcessed) return

          const customer = await tx.customer.findFirst({
            where: { id: customerId, deletedAt: null },
          })

          if (!customer) {
            throw new Error(`Customer not found: ${customerId}`)
          }

          const currentBalance = Number(customer.balance)
          const newBalance = currentBalance - paymentAmount

          await tx.accountTransaction.create({
            data: {
              customerId: customer.id,
              type: "PAYMENT",
              amount: new Prisma.Decimal(paymentAmount),
              balanceAfter: new Prisma.Decimal(newBalance),
              description: `Online odeme - NomuPay ${maskedCCNo ? `(${maskedCCNo})` : ""}`,
              referenceType: "NOMUPAY",
              referenceId,
            },
          })

          await tx.customer.update({
            where: { id: customer.id },
            data: { balance: new Prisma.Decimal(newBalance) },
          })
        })
      } else {
        const order = await prisma.order.findFirst({
          where: { orderNumber: mpay, deletedAt: null },
        })

        if (!order) {
          return seeOther(resultUrl("error", { msg: "Siparis bulunamadi" }))
        }

        const existingPayment = await prisma.accountTransaction.findFirst({
          where: { referenceType: "ORDER", referenceId: order.id },
          select: { id: true },
        })

        if (order.paymentStatus === "PAID" || existingPayment) {
          return seeOther(resultUrl("success", { order: mpay }))
        }

        const paymentAmountUSD = Number(order.grandTotal)
        const usdTryRate = await getUsdTryRate()
        const paymentTL = paymentAmountUSD * usdTryRate

        await prisma.$transaction(async (tx) => {
          const currentOrder = await tx.order.findFirst({
            where: { id: order.id, deletedAt: null },
          })

          if (!currentOrder) {
            throw new Error(`Order not found: ${order.id}`)
          }

          const alreadyProcessed = await tx.accountTransaction.findFirst({
            where: { referenceType: "ORDER", referenceId: currentOrder.id },
            select: { id: true },
          })

          if (currentOrder.paymentStatus === "PAID" || alreadyProcessed) return

          const customer = await tx.customer.findFirst({
            where: { id: currentOrder.customerId, deletedAt: null },
          })

          if (!customer) {
            throw new Error(`Customer not found: ${currentOrder.customerId}`)
          }

          await tx.order.update({
            where: { id: currentOrder.id },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              adminNotes: `Odeme alindi. Kart: ${maskedCCNo}, NomuPay OrderId: ${orderId}`,
            },
          })

          const currentBalance = Number(customer.balance)
          const newBalance = currentBalance - paymentTL

          await tx.accountTransaction.create({
            data: {
              customerId: customer.id,
              type: "PAYMENT",
              amount: new Prisma.Decimal(paymentTL),
              balanceAfter: new Prisma.Decimal(newBalance),
              description: `Siparis odemesi - ${currentOrder.orderNumber} - NomuPay ${maskedCCNo ? `(${maskedCCNo})` : ""}`,
              referenceType: "ORDER",
              referenceId: currentOrder.id,
            },
          })

          await tx.customer.update({
            where: { id: customer.id },
            data: { balance: new Prisma.Decimal(newBalance) },
          })
        })
      }

      return seeOther(resultUrl("success", { order: mpay }))
    }

    if (mpay && !mpay.startsWith("ODEME:")) {
      const failedOrder = await prisma.order.findFirst({
        where: { orderNumber: mpay },
      })

      if (failedOrder) {
        await prisma.order.update({
          where: { id: failedOrder.id },
          data: {
            adminNotes: `Odeme basarisiz: ${resultMessage || resultCode}`,
          },
        })
      }
    }

    return seeOther(resultUrl("error", { msg: resultMessage || "Odeme basarisiz" }))
  } catch (error) {
    console.error("NomuPay callback error:", error)
    return seeOther(resultUrl("error", { msg: "Callback isleme hatasi" }))
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const msg = searchParams.get("msg") || ""
  const order = searchParams.get("order") || searchParams.get("mpay") || ""

  console.log("NomuPay GET redirect:", { status, msg, order })

  if (status === "success") {
    return NextResponse.redirect(resultUrl("success", { order }))
  }

  return NextResponse.redirect(resultUrl("error", { msg: msg || "Odeme basarisiz" }))
}
