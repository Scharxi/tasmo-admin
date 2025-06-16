import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Disable ESLint during build for Docker
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checks during build for Docker
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure experimental features if needed
  experimental: {
    // Add any experimental features here
  },
};

export default nextConfig;
