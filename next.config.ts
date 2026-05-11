import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const lambdaUrl = process.env.NEXT_PUBLIC_SESSION_FUNCTION_URL;
    if (!lambdaUrl) return [];
    return [{ source: "/api/session", destination: lambdaUrl }];
  },
};

export default nextConfig;
