import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // <--- Add this line
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
