import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds:true,
  },
  typescript: {
    ignoreBuildErrors: true, // Bypasses TypeScript errors during the build
  },
  /* config options here */
};

export default nextConfig;
