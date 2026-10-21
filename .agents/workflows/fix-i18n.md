---
description: Audit and fix English/Spanish translations in the StayCare frontend
---

# Fix i18n issues

## Audit
1. Compare the key trees of `StayCare/src/i18n/en.json` and `es.json`
   (keys missing in one locale, different nesting).
2. Compare interpolation variables per key (`{name}`, `{count}`, …).
3. Search components for hardcoded user-facing strings (templates, toasts,
   modals, placeholders, `title`/`aria-label`).
4. Search for `t('…')` keys that do not exist in the locales (rendered literally).
5. Check English values left in `es.json` and vice versa; inconsistent terms.

## Fix
- Add missing keys to both files with natural translations.
- Replace hardcoded strings with `t(...)`.
- Before renaming/deleting a key, search all usages (including dynamic keys).
- Do not translate enum values, statuses, roles or API fields — only labels.
- Do not change business logic.

## Verify and report
Run `npm test` from `StayCare/` (component tests use the real `en.json`).
Report: keys added/changed/removed, files touched, strings still pending,
screens to check manually in both languages.
