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
  allowedDevOrigins: ["192.168.4.250", "192.168.5.249", "nexadepo.com", "www.nexadepo.com"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
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
