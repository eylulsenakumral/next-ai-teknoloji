import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Üst dizindeki ~/package-lock.json, Turbopack workspace root'unu yanlış yukarı taşıyordu.
  // Proje kökünü sabitle (node_modules yerel, linked dependency yok).
  turbopack: {
    root: __dirname,
  },
  typescript: {
    // Build sırasında Next'in typecheck'i çöküyor; tsc --noEmit ayrıca çalıştırılıyor.
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["192.168.4.250", "192.168.5.249", "nexadepo.com", "www.nexadepo.com"],
  images: {
    // Vercel image optimization kotası dolduğu için (HTTP 402) dış görseller bypass ediliyor.
    // b2bdepo.com görselleri zaten optimize edilmiş CDN üzerinden geliyor.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/(.*)",
          headers: securityHeaders,
        },
      ];
    }
    return [];
  },
  async redirects() {
    return [
      // Yeni menü URL'leri → mevcut route'lar
      { source: "/bayi-giris", destination: "/login", permanent: true },
      { source: "/bayimiz-olun", destination: "/basvuru", permanent: true },
      { source: "/kataloglar", destination: "/katalog", permanent: true },
      { source: "/bayi-portali", destination: "/login", permanent: true },
      // Eski/silinmiş route'lar
      { source: "/vitrin", destination: "/", permanent: true },
      { source: "/iletisim", destination: "/", permanent: true },
      { source: "/kvkk", destination: "/gizlilik-politikasi", permanent: true },
      { source: "/kategori/:slug*", destination: "/kategoriler/:slug*", permanent: true },
      { source: "/urun/:slug*", destination: "/katalog/:slug*", permanent: true },
      { source: "/hakkinda", destination: "/hakkimizda", permanent: true },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/storage/:path*",
        destination: "http://localhost:9000/nextai-assets/:path*",
      },
    ];
  },
  serverExternalPackages: [
    "@whiskeysockets/baileys",
    "jimp",
    "minio",
    "sharp",
    "qrcode-terminal",
  ],
};

export default nextConfig;
