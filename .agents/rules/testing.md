---
trigger: model_decision
description: Apply when creating or modifying frontend code with testable logic (utils, stores, composables, components with computed/conditional rendering), or when writing/fixing tests.
---

# Frontend Testing Rules

Runner: Vitest (`npm test` = `vitest run`, environment `jsdom`, files
`src/**/*.test.ts`), run from `StayCare/`. A local git `pre-commit` hook runs
`npm test`; all tests must pass. (Hooks live in `.git/hooks` and are not
versioned: re-create `pre-commit` with `cd StayCare && npm test` after cloning.)

## Workflow when creating or modifying a file

1. Check for a mirror test in `src/__tests__/` (same subfolder, `<Name>.test.ts`).
2. If it exists, update/add cases for the new behavior.
3. If not, create one when the file has testable logic (mappers, pricing,
   status helpers, computed, conditional rendering, emitted events).
4. If a test is hard to write because the component mixes HTTP + formatting,
   move the pure logic to `src/utils/`.

## Mirror structure

```
src/utils/orderMappers.ts                      → src/__tests__/utils/orderMappers.test.ts
src/utils/orderFlow.ts                         → src/__tests__/utils/orderFlow.test.ts
src/Components/ui/OrderTimeline.vue            → src/__tests__/Components/ui/OrderTimeline.test.ts
src/Components/dashboard/FacilityDashboard.vue → src/__tests__/Components/dashboard/FacilityDashboard.test.ts
```

## Vue component tests

- Test only the component's own behavior: computed, `v-if`/`v-for`
  rendering, `onMounted` loading, `watch` reactions, props and emits.
- Stub child components (`COMPONENT_STUBS`) and assert they receive the
  right props; each child has its own test file.
- Mock `@/api/*` modules; never hit the network.
- Mount with a real-locale i18n instance:
  `createI18n({ legacy: false, locale: 'en', messages: { en } })`
  importing `@/i18n/en.json`.
- Use `await flushPromises()` before asserting async results.
- `beforeEach(() => vi.clearAllMocks())` in every file.
- Always import with the `@/` alias.

## Priorities

- High: pure mapping/pricing/VAT functions, permissions and status helpers,
  `null`/`undefined`/empty lists, API failure handling (UI must not crash).
- Medium: aggregation computed, store-driven sub-view navigation.
- Do not test: CSS/Tailwind classes, internals of Vue/Pinia/vue-i18n.

Never report a test as passing unless it was executed; also run
`npm run build` before finishing when the change affects compiled code.
