import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake lucide-react so only used icons are bundled (not all 1000+)
    optimizePackageImports: ['lucide-react', '@google/genai'],
  },
  // Reduce unnecessary source map generation in dev
  productionBrowserSourceMaps: false,
  // Disable Strict Mode to prevent double-firing in dev environments
  reactStrictMode: false,
};

export default nextConfig;
