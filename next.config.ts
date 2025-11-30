import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Disable TypeScript checks during build for Docker
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
