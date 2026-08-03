# PROD-UIBO

![CI](https://github.com/a-ramirezzz/prod-uibo/actions/workflows/ci.yml/badge.svg)
![Tests](https://img.shields.io/badge/tests-138%20passing-brightgreen)
![Status](https://img.shields.io/badge/status-BETA-blue)

PROD-UIBO is a web-based Pomodoro productivity app with task management, statistics, and full visual and audio customization. It stands out with 20+ themes (including animated video backgrounds), ambient sounds, dual Picture-in-Picture support (classic + Document PiP), full offline support with a sync queue, and a bilingual (ES/EN) interface. Built with Next.js 15, React 19, and TypeScript on top of Supabase, and deployed on Vercel.

## Features

- ⏱️ Configurable Pomodoro timer with presets and custom time, wall-clock drift correction, survives refresh and sleep
- ✅ Task management with drag & drop, real-time sync via Supabase Realtime
- 📊 Productivity stats: daily sessions, streak, weekly chart (Recharts), per-task breakdown
- 🎨 20+ visual themes including animated video backgrounds
- 🔊 Ambient sounds with volume control + programmatic notification sound (Web Audio API)
- 🖼️ Dual Picture-in-Picture: classic Canvas/Video (cross-browser) + Document PiP (Chrome/Edge)
- 📡 Full offline support: Service Worker, IndexedDB mirror, sync queue with auto-replay
- 🌐 Bilingual (ES/EN) with custom i18n system — no external dependencies
- 🎓 3-step onboarding tour with cutout highlights
- 📦 Data export (JSON and CSV/ZIP)
- ⌨️ Keyboard shortcuts (7 documented)
- 🔒 CSP headers, RLS policies, check constraints, rate limiting
- ♿ Accessible: ARIA labels, live regions, focus traps, reduced-motion support
- 🧪 138 tests (unit + integration) with Vitest

## Tech Stack

**Frontend:** Next.js 15 (App Router), React 19, TypeScript 5, CSS Modules

**Backend / Services:** Supabase (PostgreSQL, Auth, Realtime), Resend (transactional email)

**Testing:** Vitest, React Testing Library, jsdom

**Infrastructure:** Vercel, GitHub Actions CI/CD

**Key libraries:** @dnd-kit (drag & drop), Recharts (charts), @serwist/next (PWA/Service Worker), idb (IndexedDB), JSZip (export)

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (free tier works)

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/a-ramirezzz/prod-uibo.git
   cd prod-uibo
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables — create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_api_key
   ```

4. Set up the database — run the SQL migration files in `src/database/migrations/` in order (coming soon; see that folder's README for details)

5. Run the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Architecture

The app uses a hooks-based architecture that separates logic from presentation:

- **State hooks** (`useTimer`, `usePomodoroEngine`, `useTimerController`) live in the page-level orchestrator, always mounted to prevent state loss on tab switches
- **Tab components** (`TimerTab`, `FocusTab`) are presentational — they receive props, no hooks
- **Providers** nest as: `LocaleProvider → AuthProvider → SettingsProvider → ThemeWrapper → ErrorBoundary`
- **Offline system** has 4 layers: Service Worker (precache), IndexedDB (local mirror), sync queue (mutation replay), UI (connection indicator + sync panel)
- **Error isolation**: per-tab ErrorBoundaries prevent crashes from propagating (Focus crashing won't kill Timer).

## Testing

```bash
npm test
```

138 tests across 15 files covering:
- Timer engine and state machine
- Pomodoro statistics calculations
- Task management with Realtime
- Auth context and session handling
- Offline sync (queue, processor, fallback)
- Integration tests (timer → engine → controller → Supabase)

## Deployment

The app is deployed on Vercel. Push to `main` triggers automatic deployment. CI runs type checking, linting, tests, and build validation via GitHub Actions before deploy.

## License

© 2025 Alan Rodrigo Ramírez Luna ([@a-ramirezzz](https://github.com/a-ramirezzz))

Licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)
