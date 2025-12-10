FinOS Frontend (Next.js + React 19)
===================================

Purpose
 - Dashboard for Gmail receipt ingestion: shows receipts, insights, sync status, and lets users retag categories.
 - Talks to the Rust backend at `NEXT_PUBLIC_API_BASE` using JWT session cookies.

Setup
1) Install deps
   npm install
2) Env
   Copy `.env.example` → `.env.local` and set:
   - `NEXT_PUBLIC_API_BASE` (default `http://localhost:4000`)
   - Optional: `NEXT_PUBLIC_EXCHANGE_RATES` JSON map to override currency rates.
3) Run
   npm run dev
4) Lint / Test
   npm run lint
   npm test   # Vitest + Testing Library

Key architecture
 - Pages: `src/app` (landing + dashboard).
 - State: `useSession`, `useReceipts`, `useSyncController` hooks.
 - API: `src/lib/api.ts` wraps fetch with credentials + typed responses.
 - Styling: Tailwind + CSS variables for light/dark (`ThemeProvider` in `src/context/theme-context.tsx`); `Panel` primitive for shared chrome.
 - UI: feature components under `src/features/dashboard/components`.

Routes (frontend)
 - `/` landing, redirects to `/dashboard` if session cookie is present.
 - `/dashboard` authenticated experience (requires backend session cookie).

Backend contracts (expected)
 - `GET /users/me` → `{ success, data: PublicUser }`
 - `GET /receipts/:email` → `{ success, data: BackendReceiptList }`
 - `PUT /receipts/:id/categories` → `{ success, data: { categories: string[] } }`
 - `POST /sync` body `{ email, last_synced? }` → `{ success, data: BackendReceiptList }`

Testing approach
 - Unit/hooks/components: Vitest + @testing-library/react (`npm test`).
 - Add Playwright/Cypress for smoke/e2e if needed.

Notes
 - Light/dark is user-toggleable (sidebar), persisted to localStorage.
 - API calls are credentialed by default via `apiFetch`; 401/403 paths reset session state in hooks.
