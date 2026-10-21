# StayCare Frontend Guidelines & UI Architecture

This document defines the architectural conventions, base UI components, error-handling patterns, and navigation rules for the StayCare frontend (`StayCare-Frontend/StayCare`).

---

## 1. UI Feedback & Dialog Standards

### Prohibited Patterns
- **Do not use native browser dialogs**: `window.confirm()`, `confirm()`, `window.alert()`, `alert()`.
- **Reason**: Native dialogs block the JavaScript thread, can be disabled by users in Chrome/Edge/Firefox, and do not conform to StayCare's Tailwind design system.

### Confirmation Dialogs (`AppModal.vue`)
For any action requiring user confirmation before execution (e.g., deleting an item, canceling an order, clearing custom prices):
1. Use `AppModal.vue` (`size="sm"` or `size="md"`).
2. Display clear context about the item being modified.
3. Provide a cancel button (`variant="secondary"`) and an action button (`AppButton` with `:loading="isProcessing"`).

### Notifications & Toasts (`useUiStore`)
All API operation feedback (success, warning, error) must use `useUiStore()`:
```javascript
import { useUiStore } from '@/stores/ui.js'

const ui = useUiStore()
ui.showSuccess(t('feature.savedSuccessfully'))
ui.showError(formattedErrorMessage)
```
Toasts are rendered globally via `AppToastStack.vue`.

---

## 2. API Error Handling & Toast Notifications (`formatApiErrorMessage` & `ui.showError`)

Never display raw backend error messages directly in the UI. Backend errors may contain unlocalized validation strings or Zod payloads.

### Standard Pattern
All API exceptions (whether during initial view loading or on user-triggered actions) must be caught and communicated using `ui.showError`:
```javascript
import { formatApiErrorMessage } from '@/utils/errors'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

try {
  await apiAction()
} catch (err) {
  ui.showError(formatApiErrorMessage(err, t('feature.fallbackErrorKey'), t))
}
```

### Prohibited: In-Template Error / Retry Cards
- **Do not build ad-hoc inline error containers or retry cards** (such as `<div v-if="!loading && error">...<AppButton>Retry</AppButton></div>`).
- **Reason**: They introduce visual fragmentation across screens and create non-standard UI states. StayCare standardizes error feedback via non-intrusive global toasts (`AppToastStack.vue`). If a detail page fails to load data, the user remains able to navigate back using `TitleHeader` and retry entering the flow cleanly.


---

## 3. Base UI Components Catalog (`src/Components/ui/`)

Before writing new HTML structures, verify whether a base component already exists:

| Component | Path | Use Case |
| :--- | :--- | :--- |
| **`TitleHeader.vue`** | `src/Components/ui/TitleHeader.vue` | Header for detail/child pages with back button and slot for badges/actions. |
| **`AppButton.vue`** | `src/Components/ui/AppButton.vue` | Standard button supporting `:loading`, `variant` (`primary`, `secondary`, `danger`), and sizes. |
| **`DataTable.vue`** | `src/Components/ui/DataTable.vue` | Responsive tables with search, custom slots, empty states, and pagination. |
| **`LoadingPanel.vue`** | `src/Components/ui/LoadingPanel.vue` | Centered loading spinner and label for async page states. |
| **`AppModal.vue`** | `src/Components/ui/AppModal.vue` | Modal dialogs, confirmations, and forms with internal scroll and backdrop blur. |
| **`StatusBadge.vue`** | `src/Components/ui/StatusBadge.vue` | Color-coded status pills for orders, invoices, and routes. |
| **`ProfileField.vue`** | `src/Components/ui/ProfileField.vue` | Key-value viewer and inline-edit input wrapper for user/client profiles. |

---

## 4. Route Navigation Conventions (`route` vs `routes`)

StayCare segregates route views by role:
- **Driver Dashboard (`DriverDashboard.vue`)**: Page key is `'route'` (`RouteView.vue`).
- **Admin / Facility Dashboards (`AdminDashboard.vue`, `FacilityDashboard.vue`)**: Page key is `'routes'` (`RoutePlanner.vue`).

When navigating back from a shared component (e.g., `PickupConfirm.vue` or `DeliveryConfirm.vue`):
```javascript
const targetRoutePage = computed(() => (authStore.isDriver ? 'route' : 'routes'))
navStore.goBack(targetRoutePage.value)
```
Calling `'route'` on an Admin session will fail to match any subpage and fall back to the default KPI overview dashboard.

---

## 5. Shared Manager Components (`src/Components/pages/shared/`)

These are reusable panel components used by both **admin** (inside `ClientDetail.vue`) and **client** (inside their own dashboard). All receive `clientId` as a required prop.

| Component | API Service | Description |
| :--- | :--- | :--- |
| **`ClientPropertiesManager.vue`** | `api/properties.ts` | CRUD for client property locations |
| **`ClientPriceListManager.vue`** | `api/priceList.ts` | Custom per-item prices for the client |
| **`ClientSubUsersManager.vue`** | `api/clientSubUsers.ts` | Custom roles (with permissions) and sub-user accounts |

### ClientSubUsersManager.vue

Manages two related resources in a single panel:

**Roles section** — above the sub-users list:
- Lists all custom roles for the client with their permissions.
- Allows creating/editing/deleting roles via `AppModal`.
- Uses `GET /api/clients/:id/roles`, `POST`, `PUT`, `DELETE`.

**Sub-users section** — below the roles:
- Lists sub-users with pagination and search.
- Allows creating/editing/deleting sub-users via `AppModal`.
- Uses `GET/POST/PUT/DELETE /api/clients/:id/users`.

**Access control**:
- The `readonly` prop (default `false`) hides all mutation controls. Use `readonly` for read-only views.
- Admin sees all; client sees only their own via `ensureClientAccess()` on the backend.

**Permissions available** (seeded by migration):
- `orders:create`, `orders:read`, `orders:update`, `orders:delete`
