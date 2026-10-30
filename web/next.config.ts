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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
};

export default nextConfig;
