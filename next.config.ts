import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.cursor.sh",
    "*.cursor.com",
    "*.cloud.cursor.sh",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "commondatastorage.googleapis.com" },
    ],
  },
};

export default nextConfig;
