---
trigger: always_on
---

# Security and Operations

Never expose, print, commit or modify: production credentials, tokens,
`.env` contents or cloud-provider credentials. Only `StayCare/.env.example`
(placeholders) is versioned.

Do **not** unless explicitly requested and approved:

- Deploy, push, merge, or touch production configuration (`vercel.json`, Vercel env)
- Point the local app to production APIs to run destructive actions

## Application security rules

- Auth uses httpOnly cookies set by the backend; never store tokens in
  `localStorage`/`sessionStorage` and never read them from JS.
- All HTTP calls go through `apiFetch` (`src/api/client.ts`), which sends
  credentials and handles session expiry.
- Hiding a button is not authorization: the backend must enforce roles,
  ownership and status transitions.
- Never render untrusted HTML (`v-html`) with API/user data.
- Never show raw backend errors; use `formatApiErrorMessage`.
- Run `npm audit` before dependency changes; do not add libraries without asking.
