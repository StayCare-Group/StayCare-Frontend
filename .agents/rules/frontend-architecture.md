---
trigger: always_on
---

# Frontend Architecture & UI Standards

Paths are relative to `StayCare/src/`. Detailed catalog:
`docs/FRONTEND_GUIDELINES.md`.

## Layers

| Layer | Folder | Responsibility |
| :--- | :--- | :--- |
| API services | `api/*.ts` | Pure HTTP via `apiFetch` (`api/client.ts`). No UI formatting. |
| Mappers / helpers | `utils/` | Pure functions: mapping, dates, pricing/VAT, status helpers. |
| Constants | `constants/` | Roles and shared constants. |
| State | `stores/` (Pinia) | `auth`, `nav`, `ui` (toasts), `lang`. |
| Reusable logic | `composables/` | Stateful logic shared by components. |
| Base UI | `Components/ui/` | Reusable presentational components. |
| Screens | `Components/pages/<role>/`, `Components/dashboard/` | Feature views. |
| Shared panels | `Components/pages/shared/` | Used by admin and client (receive `clientId`). |

- Components render and handle interaction; they do not build URLs or
  duplicate status/permission logic.
- `apiFetch` unwraps `{ success, message, data }`; paginated arrays expose
  `_pagination`. Do not re-implement this in services.

## 1. No native dialogs

Never use `alert()`, `confirm()`, `window.alert()` or `window.confirm()`.

- Confirmations: `AppModal.vue` (`size="sm" | "md"`) + `AppButton.vue`
  (`variant="danger"`, `:loading="submitting"`).
- Feedback: `useUiStore()` → `ui.showSuccess`, `ui.showError`,
  `ui.showWarning` (rendered by `AppToastStack.vue`).

## 2. API error handling

```typescript
import { formatApiErrorMessage } from '@/utils/errors'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
try {
  await someApiCall()
} catch (err) {
  ui.showError(formatApiErrorMessage(err, t('feature.fallbackErrorKey'), t))
}
```

- Never pass raw `err.message` to the UI.
- No in-template error banners or retry cards; errors go through toasts.

## 3. Reuse base components (`Components/ui/`)

`TitleHeader` (detail pages + back), `AppButton` (submits, `:loading`),
`DataTable` (tables, search, pagination), `AppPagination`, `LoadingPanel`
(loading states), `AppModal` (dialogs), `StatusBadge` (status pills),
`ProfileField`, `KpiCard`. Check the folder before creating new markup.

## 4. `route` vs `routes`

- Driver page key: `'route'` (`RouteView.vue`).
- Admin/facility page key: `'routes'` (`RoutePlanner.vue`).
- From shared pages (`PickupConfirm.vue`, `DeliveryConfirm.vue`):

```typescript
const targetRoutePage = computed(() => (authStore.isDriver ? 'route' : 'routes'))
navStore.goBack(targetRoutePage.value)
```

## 5. States

Keep loading, empty, success and error states explicit. Guard against
`null` driver/route/stop and empty lists. Disable submit buttons while a
request is in flight to avoid duplicate requests.
