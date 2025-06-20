// Frontend/next.config.ts (replace your existing file)
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove the experimental.appDir - it's deprecated in Next.js 15
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;