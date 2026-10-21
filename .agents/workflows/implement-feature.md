---
description: Plan and implement a StayCare frontend feature end to end
---

# Implement a frontend feature

## Planning (present a concise plan before cross-cutting changes)
Identify: user flow and screens, affected roles/permissions, affected order
statuses, endpoints used (existing or new — backend dependency?), components
to reuse vs. create, translation keys, test scenarios.

## Implementation
- HTTP in `src/api/`, pure logic in `src/utils/`, UI in components.
- Reuse `Components/ui/` (TitleHeader, AppButton, DataTable, AppModal,
  LoadingPanel, StatusBadge).
- Status/role logic from `orderFlow.ts`, `roles.ts`, `useAuthStore()`.
- Keep route-based and manual flows independent.
- All text via i18n in `en.json` + `es.json`.
- No new libraries without asking.

## Edge cases
Unauthorized roles, invalid status, missing route/driver/stop, repeated
clicks (disable while submitting), page refresh, empty lists, pagination,
API errors, both languages, mobile layout for driver screens.

## Verification and report
Run `npm test` and `npm run build` from `StayCare/`. Report: summary · files ·
business decisions · tests executed · translation impact · backend/API
dependency · remaining risks.
