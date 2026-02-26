---
name: introu-client-patterns
description: Coding patterns extracted from introu client (Nuxt 3 social discovery app)
version: 1.0.0
source: local-git-analysis
analyzed_commits: 24
---

# Introu Client Patterns

## Commit Conventions

This project uses **conventional commits**:
- `feat:` — New features (60% of commits)
- `fix:` — Bug fixes (13%)
- `docs:` — Documentation (design docs, plans) (17%)

Commit messages are descriptive and specific:
```
feat: add proximity-aware check-in button to detail panel
fix: add navigator guard to stopLocationTracking, fix semicolons
docs: add venue discovery and proximity check-in implementation plan
```

## Tech Stack

- **Framework:** Nuxt 3 with Vue 3 Composition API
- **State:** Pinia (Options API stores)
- **Styling:** Tailwind CSS
- **Maps:** Google Maps via `@googlemaps/js-api-loader`
- **Realtime:** Ably
- **Validation:** Zod
- **Testing:** Playwright (E2E)
- **Types:** TypeScript throughout

## Code Architecture

```
pages/              # Nuxt file-based routing (*.vue)
components/
├── ui/             # Reusable UI (prefixed: UiButton, UiCard, etc.)
├── venue/          # Venue feature components
├── chat/           # Chat feature components
└── *.vue           # Root-level layout components
composables/        # use*.ts — API wrappers and shared logic
stores/             # Pinia stores — state, getters, actions
types/              # TypeScript interfaces per domain
utils/              # Pure utility functions
tests/
├── fixtures/       # Test data
├── utils/          # Test helpers
└── *.spec.ts       # Playwright E2E specs
docs/plans/         # Design docs and implementation plans
```

## Conventions

### Composables (`composables/use*.ts`)
- One composable per domain (useVenues, useAuth, useChat, useProfile, etc.)
- Wrap API calls with try/catch, console.error, and rethrow
- Return functions and reactive refs from composable
- Use `useApi()` internally for all HTTP calls
- Type API responses with generics: `api.get<Venue[]>("/venue/nearby", params)`

### Stores (`stores/*.ts`)
- Pinia Options API (`defineStore` with state/getters/actions)
- Stores consume composables for API calls: `const { getNearbyVenues } = useVenues()`
- State interfaces defined above the store
- Helper functions (pure logic) defined outside the store as module-level functions
- Store names match domain: `useVenuesStore`, `useAuthStore`, `useChatStore`

### Types (`types/*.ts`)
- One file per domain (venue.ts, user.ts, chat.ts, match.ts)
- Export interfaces only (no classes, no enums)
- Use `?` for optional fields, not `| undefined`
- Support both API response formats when backend varies (e.g., flat vs nested coordinates)

### Components (`components/**/*.vue`)
- Feature components grouped in subdirectories (venue/, chat/, ui/)
- UI components use `Ui` prefix via Nuxt component auto-import config
- Feature components use their filename as-is (no directory prefix)

### API Layer
- `useApi()` composable handles auth headers and base URL
- API methods: `api.get<T>()`, `api.post<T>()`
- Response shape: `{ success: boolean, data: T, message?: string }`
- Location headers injected on authenticated requests: `X-Latitude`, `X-Longitude`

## Workflows

### Adding a New Feature (Venue Domain Example)
Files typically changed together:
1. `types/venue.ts` — Add/update interfaces
2. `composables/useVenues.ts` — Add API method
3. `stores/venues.ts` — Add state, getters, actions
4. `components/venue/*.vue` — Update UI components

### Design-First Development
This project follows a design-then-implement workflow:
1. Write design doc → `docs/plans/YYYY-MM-DD-<topic>-design.md`
2. Write implementation plan → `docs/plans/YYYY-MM-DD-<topic>-plan.md`
3. Implement type changes first, then composable, store, and finally components
4. Build verification via `npx nuxi build`

### File Co-Change Patterns
- `types/venue.ts` + `stores/venues.ts` (always change together for features)
- `composables/useVenues.ts` + `stores/venues.ts` (store consumes composable)
- `components/venue/VenueBottomSheet.vue` + `components/venue/VenueDetailPanel.vue` (mobile + desktop parity)
- `components/venue/VenueMap.vue` + `stores/venues.ts` (map reads from store)

## Reactive Patterns

### External Ref in Pinia Getter
The store reads a module-scoped `ref` from a composable to get reactive location updates:
```typescript
// composables/useLocation.ts
export const _sharedLocation = ref<Coordinates | null>(null);

// stores/venues.ts — getter uses function syntax for `this` access
venuesWithProximity(): Venue[] {
  const location = _sharedLocation.value; // reactive dependency
  return this.venues.map((v) => { /* compute distance */ });
}
```

### Client-Side Proximity Calculation
- Haversine formula for distance between user GPS and venue coordinates
- Handles both `venue.location.latitude` (nested) and `venue.latitude` (flat) formats
- String-to-number coercion for API responses that may return numeric strings
