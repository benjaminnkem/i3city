import type { NextConfig } from "next";

function cdnHost(): string | null {
  const url = process.env.NEXT_PUBLIC_CDN_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const host = cdnHost();

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    unoptimized: true,
    remotePatterns: host ? [{ protocol: "https", hostname: host }] : [],
  },
};

export default nextConfig;
