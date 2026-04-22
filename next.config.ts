import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.5.249", "nexadepo.com", "www.nexadepo.com"],
  turbopack: {
    root: "/home/tolgabrk/projects/next-ai-teknoloji",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
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
