---
description: Check that a frontend change is ready to commit/merge (tests, build, i18n, UI standards)
---

# Review feature readiness (frontend)

Verify and report each item with evidence (command output or file reference):

1. `npm test` passes and `npm run build` passes (from `StayCare/`).
2. Mirror tests exist/updated for new logic.
3. Every new string exists in `en.json` and `es.json` (same keys, same placeholders).
4. No `alert`/`confirm`; errors via `formatApiErrorMessage` + `ui.showError`.
5. Base UI components reused; loading/empty states explicit.
6. Status/role logic comes from `orderFlow.ts` / `roles.ts` / `authStore`.
7. Manual flows handle missing driver/route/stop.
8. Backend contract matches (fields, pagination, permissions); backend changes listed.
9. No secrets, `.env` or credentials in the diff.
10. No unrelated changes, dead code or leftover `console.log`.

Output: ready / not ready, blocking issues, non-blocking issues, manual checks pending.
