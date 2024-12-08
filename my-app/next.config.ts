import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  exportPathMap: async function() {
    return {
      '/': { page: '/' },
      '/blog': { page: '/blog' },
      // Add explicit paths for your blog posts
      '/blog/terraform-autoscaling-group': { page: '/blog/[slug]', query: { slug: 'terraform-autoscaling-group' } },
      '/blog/building-a-blog-with-aws-terraform': { page: '/blog/[slug]', query: { slug: 'building-a-blog-with-aws-terraform' } }
    }
  }
};

export default nextConfig;
