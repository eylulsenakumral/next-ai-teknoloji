import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.5.249", "nexadepo.com", "www.nexadepo.com"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
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
