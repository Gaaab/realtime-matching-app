# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Nuxt dev server at localhost:3000
npm run build        # Production build (or: npx nuxi build)
npm run test         # Run all Playwright E2E tests
npm run test:ui      # Interactive Playwright test UI
npx playwright test tests/auth.spec.ts   # Run a single test file
npx playwright test --debug              # Debug mode with inspector
```

No linter or formatter is configured. No unit test framework — only Playwright E2E tests in `tests/`.

## Architecture

**Nuxt 3 + Vue 3 Composition API + TypeScript + Pinia + Tailwind CSS**

The app is a social discovery / dating platform (Intro.u) connecting to a Laravel API backend. Key features: phone OTP auth, venue discovery with location-based check-ins, real-time chat via Ably, matching system.

### Layer pattern: Types → Composables → Stores → Components

1. **`types/*.ts`** — One file per domain. Interfaces only (no enums/classes). Use `?` for optional fields.

2. **`composables/use*.ts`** — One per domain. Thin wrappers around `useApi()` calls. Pattern: try/catch, `console.error`, rethrow. Return functions and refs.

3. **`stores/*.ts`** — Pinia **Options API** (`defineStore` with state/getters/actions). Actions call composables for API work. Pure helper functions live as module-level functions outside the store definition.

4. **`components/`** — Auto-imported by Nuxt. `components/ui/` uses `Ui` prefix (e.g., `Button.vue` → `<UiButton>`). All other subdirectories (`venue/`, `chat/`) have no directory prefix — just filename (e.g., `VenueMap.vue` → `<VenueMap>`).

### API layer (`composables/useApi.ts`)

Central HTTP client wrapping `fetch`. All requests go through this.
- Response shape: `{ success: boolean, data: T, message?: string, http_status: number }`
- Error shape: `{ success: false, http_status, message, errors?: Record<string, string[]> }`
- Auth token stored in `localStorage` as `auth_token`, injected as `Bearer` header
- Authenticated requests automatically inject `X-Latitude`/`X-Longitude` headers from shared location state
- Methods: `api.get<T>()`, `api.post<T>()`, `api.put<T>()`, `api.patch<T>()`, `api.delete<T>()`, `api.uploadFile<T>()`

### Reactive location pattern

`composables/useLocation.ts` exports a module-scoped `ref` called `_sharedLocation`. The venues store reads this directly in a getter (`venuesWithProximity`) to reactively recompute distances as GPS updates. The getter uses function syntax (not arrow) for `this` access.

### Middleware

- `middleware/auth.ts` — Redirects to `/login` if not authenticated (client-side only)
- `middleware/guest.ts` — Redirects authenticated users away from login/register; hydrates auth from `localStorage` on first load

### Environment variables

Set in `.env` (see `.env.example`):
- `NUXT_PUBLIC_API_BASE` — Backend API URL (default: `http://localhost:8000/api/v1`)
- `NUXT_PUBLIC_ABLY_KEY` — Ably realtime key
- `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps/Places key

Access via `useRuntimeConfig().public.*`.

## Conventions

- **Commits**: Conventional commits — `feat:`, `fix:`, `docs:`, `refactor:`
- **Venue coordinates**: Backend may return flat (`venue.latitude`) or nested (`venue.location.latitude`) formats, and values may be strings. Always handle both via `getVenueCoords()` in `stores/venues.ts`.
- **Check-in data**: Use `google_place_id` for Google Places venues, `venue_id` for admin-created venues.
- **Tailwind theme**: Primary color `#0050FF`, accent `#00D9FF` — configured in `tailwind.config.js`.
- **Design-first workflow**: Design docs and implementation plans go in `docs/plans/` with naming `YYYY-MM-DD-<topic>-{design,plan}.md`.
