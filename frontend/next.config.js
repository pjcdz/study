const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    missingSuspenseWithCSRBailout: false,
  },
  // Ensure fonts load properly in Docker container
  assetPrefix: process.env.NODE_ENV === 'development' ? undefined : '',
  // Add basePath for the app if needed
  // basePath: '',
};

module.exports = withNextIntl(nextConfig);