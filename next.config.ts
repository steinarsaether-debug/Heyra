import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(process.cwd()),
  distDir: process.env.HEYRA_NEXT_DIST_DIR ?? ".next",
  images: {
    formats: ["image/webp"],
  },
};

export default nextConfig;
