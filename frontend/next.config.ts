import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Romancham",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
