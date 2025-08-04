import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore les erreurs ESLint lors du build en production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore les erreurs TypeScript lors du build (facultatif)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
