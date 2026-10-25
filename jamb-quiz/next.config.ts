import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next.js walks up,
  // finds the legacy project's package-lock.json in the parent directory, and
  // warns about "multiple lockfiles".
  outputFileTracingRoot: path.resolve(__dirname),
  // Allow the dev server to serve HMR/assets when opened from a phone on the
  // LAN. Update this if the machine's network address changes.
  allowedDevOrigins: ["10.157.252.151"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
