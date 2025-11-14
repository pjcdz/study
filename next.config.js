const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');

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
  // Configure API body parser for file uploads
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
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
        cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
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

module.exports = withNextIntl(nextConfig);
