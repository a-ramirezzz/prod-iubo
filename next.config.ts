/**
 * =================================================================
 * next.config.ts
 * -----------------------------------------------------------------
 * This file contains the configuration for the Next.js application.
 * It is used to customize various aspects of the framework's
 * behavior, such as image optimization, redirects, and more.
 * =================================================================
 */

import { NextConfig } from "next";
import path from "path";

/**
 * @type {import('next').NextConfig}
 */
const nextConfig: NextConfig = {
  /**
   * Configuration for the Next.js Image component (`<Image />`).
   * It allows specifying which external domains are permitted for image optimization.
   */
  images: {
    remotePatterns: [
      // Allow images from 'placehold.co' for theme previews.
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Allow images from 'images.unsplash.com' for static theme backgrounds.
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  /**
   * Webpack configuration for path aliases
   * This ensures that the @ alias works correctly in both development and production
   */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;

// =================================================================
// END OF FILE
// =================================================================