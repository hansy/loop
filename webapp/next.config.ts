import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "legislative-pink-lamprey.myfilebase.com",
      },
    ],
  },
};

export default nextConfig;
