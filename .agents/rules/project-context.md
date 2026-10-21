---
trigger: always_on
---

# StayCare Frontend — Project Context

StayCare is an existing, production-oriented, bilingual (en/es) B2B laundry
management application. This repository is the **web frontend**; the Vue app
lives in `StayCare/`. The REST API lives in a separate repository
(`staycare_back`).

Do not recreate the project, replace its architecture or change its stack.
Full business context: `docs/PROJECT_CONTEXT.md`. UI standards:
`docs/FRONTEND_GUIDELINES.md`.

## Stack (verified against `StayCare/package.json`)

- Vue 3 (`<script setup>`), Vite 7, Tailwind CSS 4
- Pinia (`src/stores/`: `auth.js`, `nav.js`, `ui.js`, `lang.js`)
- vue-i18n 11 (`src/i18n/en.json`, `src/i18n/es.json`)
- vue-router only for public pages (`src/router.js`, `src/Pages/`);
  in-dashboard navigation uses `useNavStore()` (`currentPage`, `goBack`)
- Mixed TypeScript / JavaScript; alias `@/` → `src/`
- Tests: Vitest + `@vue/test-utils` + jsdom
- Deployment: Vercel (`vercel.json`)

## Roles (source of truth: `src/constants/roles.ts`)

`admin`, `staff`, `operator`, `driver`, `client`.

- Use the helpers from `roles.ts` and the computed flags of `useAuthStore()`
  (`isAdmin`, `isStaff`, `isDriver`, `isClient`, `isOperator`,
  `isAdminOrStaff`, `isInternal`, `hasPermission(perm)`).
- Client sub-users carry `permissions` (`orders:create|read|update|delete`).
- Frontend checks only hide/show UI; **the backend is the authority**.

## Order statuses (source of truth in the frontend: `src/utils/orderFlow.ts`)

API values are **snake_case**: `pending, assigned, rescheduled, transit,
arrived, washing, drying, ironing, quality_check, ready_to_delivery,
collected, delivered, completed, cancelled`.

- Use the `OrderStatus` type and the helpers in `orderFlow.ts`
  (`isEditableStatus`, `isCancelableStatus`, `INVOICEABLE_STATUSES`, …).
- Never redefine status lists inside components.
- Do not invent statuses or transitions; confirm them in the backend
  (`OrderService`) before changing UI behavior.

## Order flows

- Route-based pickup/delivery (driver, route, route stops).
- Manual pickup/delivery: **no driver, route or route stop**. Never assume
  they exist in the UI (guard against `null`).

## Sources of truth (in order)

1. Backend business logic and authorization
2. DB schema and stored values
3. Enums, constants, types
4. API contracts
5. Frontend implementation
6. Project documentation

When docs and code disagree, report the conflict instead of silently
changing behavior.
