import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "logos.getquikturn.io",
      },
    ],
  },
};

export default nextConfig;
