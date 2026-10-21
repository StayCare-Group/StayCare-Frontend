---
description: Investigate and fix a StayCare frontend bug (root cause first, smallest complete fix)
---

# Fix a frontend bug

## Investigation
1. Describe observed vs. expected behavior (role, screen, language).
2. Trace it: component → store/composable → util → API service → endpoint.
3. Check the backend response/permissions. If the root cause is in the
   backend, report it instead of masking it in the UI.
4. Verify roles, order statuses, manual vs. route-based flow, `null` data.
5. Check similar screens for the same problem.

## Implementation
1. Explain the proposed solution.
2. Smallest complete fix; no unrelated refactors.
3. Preserve behavior for other roles and flows.
4. Any new text → `en.json` + `es.json`.
5. Add or update the mirror test in `src/__tests__/`.

## Verification
Each affected role, English and Spanish, empty/`null` data, API failure
(toast shown, UI does not crash), repeated clicks, page refresh.
Run `npm test` (and `npm run build`) from `StayCare/`.

## Final report
Root cause · files changed · changes · commands executed · translation
impact · backend/API impact · remaining risks. Never claim a test passed
unless it ran.
