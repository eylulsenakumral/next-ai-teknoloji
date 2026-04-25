import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { encode } from "next-auth/jwt";

// Mobile-only login endpoint (bypasses NextAuth CSRF)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealerCode, password } = body;

    if (!dealerCode || !password) {
      return NextResponse.json(
        { error: "Bayi kodu ve şifre gereklidir" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        dealerCode: dealerCode.trim().toUpperCase(),
        deletedAt: null,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Bayi kodu veya şifre hatalı" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Bayi kodu veya şifre hatalı" },
        { status: 401 }
      );
    }

    if (customer.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Hesabınız askıya alınmıştır" },
        { status: 403 }
      );
    }

    if (customer.status === "BLACKLISTED") {
      return NextResponse.json(
        { error: "Hesabınıza erişim kısıtlanmıştır" },
        { status: 403 }
      );
    }

    if (customer.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Hesabınız henüz onaylanmamıştır" },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    const maxAge = 30 * 24 * 60 * 60; // 30 days
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      console.error("Mobile login error: NEXTAUTH_SECRET is missing");
      return NextResponse.json(
        { error: "Giriş yapılandırması eksik" },
        { status: 500 }
      );
    }

    const token = await encode({
      secret,
      maxAge,
      token: {
        id: customer.id,
        dealerCode: customer.dealerCode,
        companyName: customer.companyName,
        contactName: customer.contactName ?? "",
        email: customer.email ?? undefined,
        role: "dealer" as const,
        status: customer.status,
      },
    });

    const secureCookie =
      process.env.NEXTAUTH_URL?.startsWith("https://") ||
      req.nextUrl.protocol === "https:";
    const cookieNames = secureCookie
      ? ["next-auth.session-token", "__Secure-next-auth.session-token"]
      : ["next-auth.session-token"];

    const response = NextResponse.json({
      sessionToken: token,
      data: {
        id: customer.id,
        dealerCode: customer.dealerCode,
        companyName: customer.companyName,
        tradeName: customer.tradeName,
        contactName: customer.contactName,
        contactTitle: customer.contactTitle,
        phone: customer.phone,
        phone2: customer.phone2,
        email: customer.email,
        taxOffice: customer.taxOffice,
        taxNumber: customer.taxNumber,
        address: customer.address,
        city: customer.city,
        district: customer.district,
        postalCode: customer.postalCode,
        whatsappPhone: customer.whatsappPhone,
        status: customer.status,
        balance: customer.balance,
        creditLimit: customer.creditLimit,
        discountRate: customer.discountRate,
        createdAt: customer.createdAt.toISOString(),
        approvedAt: customer.approvedAt?.toISOString(),
        lastLoginAt: customer.lastLoginAt?.toISOString(),
      },
    });

    for (const name of cookieNames) {
      response.cookies.set(name, token, {
        httpOnly: true,
        secure: name.startsWith("__Secure-") || secureCookie,
        sameSite: "lax",
        path: "/",
        maxAge,
      });
    }

    return response;
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { error: "Giriş başarısız" },
      { status: 500 }
    );
  }
}
