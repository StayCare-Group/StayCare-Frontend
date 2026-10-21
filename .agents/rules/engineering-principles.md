---
trigger: always_on
---

# Engineering Principles (Frontend)

## Analysis before modification

1. Inspect the relevant components, stores, composables, utils and API services.
2. Inspect the backend endpoint it consumes (request/response, pagination,
   permissions). If the root cause is in the backend, say so — do not patch
   it only in the frontend.
3. Confirm affected roles, permissions and order statuses.
4. Identify the root cause; do not patch symptoms.
5. Explain the approach before large or cross-cutting changes.

## Business rules

- Do not invent statuses, roles, permissions or transitions.
- Reuse `orderFlow.ts`, `roles.ts`, mappers in `utils/` and existing stores.
- Do not assume a driver, route or route stop exists (manual flows).
- Preserve route-based flows when changing manual flows (and vice versa).
- Frontend validation is UX only; the backend must also validate.
- Search all usages before renaming shared props, statuses or translation keys.

## Coding rules

- Follow existing architecture and naming; small, reviewable changes.
- No unrelated refactors. No new libraries without asking first.
- No duplicated status, permission or API logic across components.
- No empty `catch`, forced casts or arbitrary fallbacks that hide failures.
- Apply SOLID, DRY, KISS, YAGNI and separation of concerns when they bring
  clear value.

## Refactoring

Before refactoring: state the concrete problem, affected files/behavior and
why it is needed now. Do not mix large refactors with bug fixes. Report
out-of-scope problems separately, ranked Critical/High/Medium/Low.

## Final report (after every change)

1. Root cause or feature summary
2. Files changed
3. Business decisions
4. Tests and commands actually executed
5. Translation impact (keys added/changed in en + es)
6. API contract impact (backend change needed?)
7. Remaining risks / manual checks
