/**
 * =================================================================
 * next.config.ts
 * -----------------------------------------------------------------
 * This file contains the configuration for the Next.js application.
 * It is used to customize various aspects of the framework's
 * behavior, such as image optimization, redirects, and more.
 * =================================================================
 */

const path = require("path");

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
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
   * The Content-Security-Policy locks resource loading down to the app's own
   * origin plus the few external hosts the app genuinely uses:
   *  - Supabase REST + Realtime (wss) via the *.supabase.co wildcard.
   *  - placehold.co and images.unsplash.com for theme preview / background images
   *    (these mirror `images.remotePatterns` above).
   *
   * `'unsafe-inline'` is required for Next.js App Router hydration scripts and
   * its injected inline styles; a nonce-based policy would need custom
   * middleware and is intentionally out of scope here. Vercel Analytics and
   * Speed Insights are served from the same origin (`/_vercel/*`) and so are
   * already covered by `'self'`.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "media-src 'self' blob: data:",
              "worker-src 'self' blob:",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
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

module.exports = nextConfig;

// =================================================================
// END OF FILE
// =================================================================