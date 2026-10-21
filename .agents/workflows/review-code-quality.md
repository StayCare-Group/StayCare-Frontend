---
description: Read-only review of frontend code quality and architecture (no code changes until scope is approved)
---

# Review frontend code quality

Analyze the requested area **without modifying code**. Review: component
size and responsibilities, HTTP calls outside `api/`, formatting logic that
should live in `utils/`, duplicated status/role/permission logic, hardcoded
strings, native dialogs, raw error messages, inline error cards, missing
loading/empty states, missing `null` guards (driver/route/stop), reuse of
base UI components, prop drilling vs. stores, `any` usage, testability,
SOLID/DRY/KISS/YAGNI. Do not recommend a full rewrite.

For each finding give: severity (Critical/High/Medium/Low/Optional), file and
location, current problem, practical impact, recommended improvement,
estimated risk, fix-now vs. track-later.

Group into **Must fix**, **Should fix**, **Future improvement**.
Do not modify code until the refactoring scope is approved.
