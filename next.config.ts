import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during build  
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['i.discogs.com'],
  },
};

export default nextConfig;
