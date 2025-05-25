const createNextIntlPlugin = require('next-intl/plugin');
const { withSentryConfig } = require("@sentry/nextjs");

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
      }
      // Removed the Sentry monitoring rewrite since we've added a dedicated API route handler
    ];
  },
  // Configure static assets to work with internationalization
  images: {
    unoptimized: true,
    domains: ['study.cardozo.com.ar'],
  },
  // Optimize fonts but use local fallbacks in development
  optimizeFonts: true,
  // Experimental features for maximum performance
  experimental: {
    // Add any experimental features here if needed
    missingSuspenseWithCSRBailout: false,
    // Disable instrumentation hook in development for faster startup
    instrumentationHook: process.env.NODE_ENV === 'production',
    // Enable SWC minify for faster builds
    swcMinify: true,
    // Enable new App Router optimizations
    appDir: true,
    // Enable server components optimizations
    serverComponentsExternalPackages: ['@next/font'],
    // Enable faster refresh
    turbo: {
      loaders: {
        '.svg': ['@svgr/webpack'],
      },
    },
  },
  // Ensure fonts load properly in Docker container
  assetPrefix: process.env.NODE_ENV === 'development' ? undefined : '',
  // Add basePath for the app if needed
  // basePath: '',
  
  // Development optimizations for high-performance MacBook
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { dev, isServer }) => {
      // Optimize webpack for development with more resources
      config.watchOptions = {
        poll: false, // Disable polling for better performance on macOS
        aggregateTimeout: 100, // Faster response time
        ignored: /node_modules/,
      };
      
      // Enable more aggressive caching
      config.cache = {
        type: 'filesystem',
        maxMemoryGenerations: 5,
        cacheDirectory: '.next/cache/webpack',
      };
      
      // Optimize chunk splitting for faster HMR
      if (dev && !isServer) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
        };
      }
      
      // Enable faster builds with more workers
      config.parallelism = 8;
      
      return config;
    },
    
    // Enable faster compilation with more memory
    onDemandEntries: {
      maxInactiveAge: 60 * 1000, // Keep pages in memory longer
      pagesBufferLength: 10, // Keep more pages in buffer
    },
    
    // Optimize for faster startup
    compiler: {
      styledComponents: true,
    },
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    generateEtags: false,
  }),
};

// Only apply Sentry in production or when explicitly enabled
const shouldUseSentry = process.env.NODE_ENV === 'production' && !process.env.NEXT_DISABLE_SENTRY;

// Compose configurations properly
module.exports = shouldUseSentry 
  ? withSentryConfig(
      withNextIntl(nextConfig),
      {
        // For all available options, see:
        // https://www.npmjs.com/package/@sentry/webpack-plugin#options

        org: "pjcdz",
        project: "studyapp",

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        // This can increase your server load as well as your hosting bill.
        // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
        // side errors will fail.
        tunnelRoute: "/monitoring",

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,

        // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
        // See the following for more information:
        // https://docs.sentry.io/product/crons/
        // https://vercel.com/docs/cron-jobs
        automaticVercelMonitors: true,
      }
    )
  : withNextIntl(nextConfig);
