/**
 * =================================================================
 * next.config.ts
 * -----------------------------------------------------------------
 * This file contains the configuration for the Next.js application.
 * It is used to customize various aspects of the framework's
 * behavior, such as image optimization, redirects, and more.
 * =================================================================
 */

import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /**
   * Automatically memoizes components and hooks at build time,
   * replacing the need for manual useMemo/useCallback/React.memo.
   */
  reactCompiler: true,
  experimental: {
    // Load only the modules actually used from these packages instead of
    // the whole barrel, so tree-shaking doesn't pull in unused code.
    optimizePackageImports: [
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'framer-motion',
    ],
  },
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
   * Security headers applied to every route.
   *
   * Content-Security-Policy is set per-request by `src/middleware.ts`
   * instead of here, since it needs a fresh nonce for every response —
   * something `headers()` can't generate (it only returns static values).
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
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

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Only precache the app shell's own static assets, never the large
  // background videos / ambient sounds in public/ (100+ MB combined).
  globPublicPatterns: [
    "favicon.png",
    "manifest.json",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon-512-maskable.png",
  ],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  disable: process.env.NODE_ENV === "development",
});

const configWithSerwist = withSerwist(nextConfig);
const configWithAnalyzer = analyzer(configWithSerwist);

// Sentry must be the outermost wrapper so its build-time source map upload
// sees the final webpack config produced by every other plugin.
export default withSentryConfig(configWithAnalyzer, {
  org: "a-ramirezzz",
  project: "prod-uibo",

  // Only print upload logs outside CI to keep local builds quiet.
  silent: !process.env.CI,

  // Automatically tree-shake Sentry logger statements from the client bundle.
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

// =================================================================
// END OF FILE
// =================================================================
