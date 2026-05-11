import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth"],
  images:{
    remotePatterns:[
      {hostname: 'img.clerk.com'}
    ]
  }
};

export default nextConfig;
