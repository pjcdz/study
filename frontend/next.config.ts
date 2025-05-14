import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // Explicitly disable ESLint during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Pass environment variables to the browser
  env: {
    USE_DEMO_CONTENT: process.env.USE_DEMO_CONTENT || 'false',
  },
  // Enable CORS for API requests
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/:path*`,
      },
    ];
  },
  // Configure static assets to work with internationalization
  images: {
    unoptimized: true,
  },
  // Optimize fonts but use local fallbacks in development
  optimizeFonts: true,
  // Experimental features
  experimental: {
    // Add any experimental features here if needed
  },
  // Ensure fonts load properly in Docker container
  assetPrefix: process.env.NODE_ENV === 'development' ? undefined : '',
  // Add basePath for the app if needed
  // basePath: '',
};

export default withNextIntl(nextConfig);
