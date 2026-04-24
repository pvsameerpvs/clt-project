import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // <--- Add this line
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
