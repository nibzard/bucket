import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress webpack cache warnings in development
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Suppress webpack cache warnings
      config.infrastructureLogging = {
        level: 'error',
      };
      
      // Fix webpack cache strategy issues
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        // Improve cache reliability
        managedPaths: [],
        profile: false,
      };
      
      // Fix resolve dependencies snapshot issues
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
        buildDependencies: {
          hash: true,
          timestamp: true,
        },
        module: {
          timestamp: true,
        },
        resolve: {
          timestamp: true,
        },
        resolveBuildDependencies: {
          timestamp: true,
        },
      };
    }
    return config;
  },
  
  // Suppress punycode deprecation warnings and optimize for development
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client'],
    // Optimize webpack for development
    webpackBuildWorker: true,
    // Improve cache reliability
    caseSensitiveRoutes: false,
  },
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;