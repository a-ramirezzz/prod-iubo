import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send events in production — no noise from local development.
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring — the free plan has limited events, 10% is enough.
  tracesSampleRate: 0.1,

  // Session replay — sample 1% normally, 100% on error.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
