import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 70, 75, 80, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "corporate.abbeygate-england.com",
      },
    ],
  },
  allowedDevOrigins: ['local.abbeygate-england.com'],
};

export default nextConfig;