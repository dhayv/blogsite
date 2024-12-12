import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  generateStaticParams: true,
  images: {
    unoptimized: true, 
  },
};

export default nextConfig;
