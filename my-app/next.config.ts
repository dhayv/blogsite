import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  generateStaticParams: true,
};

export default nextConfig;
