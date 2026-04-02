# Architecture - StayCare Frontend

## Overview

StayCare is a Vue 3 application implementing a laundry management system with a modular architecture based on:
- **Component-based**: Reusable and specialized components
- **MVVM Architecture**: Clear separation between model, view, and logic
- **Reactive State**: State management with Pinia

```
┌─────────────────────────────────────────┐
│         User Interface Layer            │
│  (Components, Pages, Dashboards)        │
├─────────────────────────────────────────┤
│         State Management (Pinia)        │
│  (auth, nav, ui stores)                 │
├─────────────────────────────────────────┤
│         API Layer                       │
│  (Axios + apiFetch wrapper)             │
├─────────────────────────────────────────┤
│         Backend API                     │
│  (Node.js/Express)                      │
└─────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── api/
│   ├── client.ts          # Base HTTP client (apiFetch)
│   ├── users.ts           # Users API (role=client for clients)
│   ├── facility.ts        # Machines and assignments API
│   ├── orders.ts          # Orders API
│   ├── routes.ts          # Routes API (drivers)
│   └── ...
│
├── Components/
│   ├── dashboard/
│   │   ├── AdminDashboard.vue
│   │   ├── ClientDashboard.vue
│   │   ├── DriverDashboard.vue
│   │   └── FacilityDashboard.vue
│   │
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── ClientDetail.vue    # Client profile (admin)
│   │   │   ├── CreateOrder.vue     # Create order (admin)
│   │   │   ├── UserManagement.vue  # User management
│   │   │   └── ...
│   │   │
│   │   ├── facility/
│   │   │   ├── Processing.vue      # Kanban + machines
│   │   │   ├── Reception.vue       # Order reception
│   │   │   └── ...
│   │   │
│   │   ├── driver/
│   │   │   ├── RouteView.vue       # Daily route view
│   │   │   ├── DriverHistory.vue   # Delivery history
│   │   │   └── ...
│   │   │
│   │   └── shared/
│   │       ├── OrdersList.vue      # Orders list (reusable)
│   │       ├── OrderDetail.vue     # Order detail
│   │       └── ...
│   │
│   └── ui/
│       ├── AppButton.vue           # Standard button
│       ├── DataTable.vue           # Reusable table
│       ├── StatusBadge.vue         # Status badge
│       ├── Toast.vue               # Notification
│       └── ...
│
├── i18n/
│   ├── es.json                    # Spanish translations
│   ├── en.json                    # English translations
│   └── index.js                   # i18n configuration
│
├── stores/
│   ├── auth.js                    # Authentication state
│   ├── nav.js                     # Navigation state
│   ├── ui.js                      # UI state (toasts)
│   └── index.js                   # Store initialization
│
├── utils/
│   ├── orderFlow.ts               # Order flow logic
│   ├── statusUtils.ts             # Status utilities
│   ├── orderEligibility.ts        # Eligibility validations
│   └── ...
│
├── types/
│   ├── order.ts                   # Order interfaces
│   ├── machine.ts                 # Machine interfaces
│   ├── user.ts                    # User interfaces
│   └── ...
│
├── router/
│   └── index.js                   # Route definitions
│
├── App.vue                        # Root component
└── main.js                        # Entry point
```

## Data Flow

### 1. Authentication

```
Login Form
    ↓
authStore.login()
    ↓
API: POST /api/auth/login
    ↓
authStore.user = userData
    ↓
Router: redirect to /dashboard
```

### 2. Machine Management (Facility - Admin)

```
Processing.vue (Kanban view)
    ↓
Click "Edit/Delete"
    ↓
Edit modal or confirmation
    ↓
handleEditMachine() / handleDeleteMachine()
    ↓
API: PUT/DELETE /api/machines/:id
    ↓
loadData() reloads machines
    ↓
ui.showSuccess() notifies user
    ↓
View updates automatically
```

### 3. Machine Assignment and State Advance

```
handleAssign(machineId, orderId)
    ↓
API: POST /api/machines/:id/assign
    ↓
getNextStatus(currentStatus)
    ↓
advanceOrder(orderId, nextStatus)
    ↓
API: PUT /api/orders/:id/status
    ↓
loadData() updates Kanban
    ↓
ui.showSuccess() notifies
```

## State Management (Pinia)

### auth.js
```javascript
- user: { id, email, role, ... }
- isAuthenticated: boolean
- login()
- logout()
- fetchMe()
```

### nav.js
```javascript
- currentPage: string
- navigate(page)
- breadcrumbs: array
```

### ui.js
```javascript
- toasts: array
- pushToast(type, message)
- showError(message)
- showSuccess(message)
- dismissToast(id)
```

## API Layer

### apiFetch() - Base HTTP Client

```javascript
// src/api/client.ts
export async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json' }
  })
  // Response and error handling
}
```

### Specific API Modules

```javascript
// src/api/facility.ts
export async function fetchMachineStatus()
export async function assignMachine(machineId, orderId)
export async function releaseMachine(machineId)
export async function updateMachine(id, data)
export async function deleteMachine(id)
```

## Key Components

### Processing.vue (Kanban Board)

**Local State:**
```javascript
- allOrders: ref[]          // Orders from all columns
- machines: ref[]           // Machine status
- machineSelections: reactive{}  // Selected machines per order
- editingMachineId: ref     // Machine ID being edited
```

**Functions:**
```javascript
- loadData()               // Load orders and machines
- advanceOrder()           // Move order to next state
- handleAssign()           // Assign machine and advance state
- handleAddMachine()       // Create or edit machine
- handleDeleteMachine()    // Delete machine
- getAssignedMachine()     // Get assigned machine
- availableMachines()      // Filter available machines
```

**Pipeline (States):**
```
arrived → washing → drying → ironing → quality_check → ready_to_delivery
```

## Internationalization (i18n)

### Key Structure

```json
{
  "common": {
    "name": "Name",
    "edit": "Edit",
    ...
  },
  "facilityProcessing": {
    "addMachine": "Add Machine",
    "editMachine": "Edit Machine",
    ...
  }
}
```

### Usage in Components

```vue
<template>
  <button>{{ $t('admin.edit') }}</button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const message = t('facilityProcessing.machineAdded')
</script>
```

## Validations

### Order Creation Eligibility

File: `src/utils/orderEligibility.ts`

```javascript
function isClientProfileCompleteForOrder(meData) {
  // Validates:
  // - user.phone
  // - client_profile.contact_person
  // - client_profile.billing_address
  return true/false
}
```

### State Normalization

File: `src/utils/orderFlow.ts`

```javascript
function getRouteTypeFromOrderStatus(status)
function normalizeProcessingStatus(status)
function isDeliveryAssignableStatus(status)
```

## Roles and Permissions

| Role | Accessible Components |
|------|----------------------|
| **admin** | All pages, edit users, create orders, manage machines |
| **client** | ClientDashboard, OrdersList, OrderDetail, Profile |
| **driver** | DriverDashboard, RouteView, DriverHistory |
| **staff** | FacilityDashboard, Processing, Reception, machines (edit/delete) |

## Error Handling

### Global

```javascript
// In any component
try {
  await apiCall()
  ui.showSuccess('Operation successful')
} catch (err) {
  ui.showError(err?.message || 'Unknown error')
}
```

### In API Layer

```javascript
// apiFetch() captures and parses errors
if (!response.ok) {
  const error = await response.json()
  throw new Error(error.message)
}
```

## Responsive Design

All components use Tailwind CSS with breakpoints:
- Mobile: base
- Tablet: `md:`
- Desktop: `lg:`, `xl:`

```vue
<div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- Responsive -->
</div>
```

## Performance Optimization

1. **Lazy Loading**: Routes loaded on demand
2. **Computed Properties**: Memoized calculations
3. **Watchers**: Efficient reactive updates
4. **Component Splitting**: Small and focused components

## Testing Strategy (TODO)

- [ ] Unit tests: `src/**/*.spec.js`
- [ ] Component tests: Vitest + Vue Test Utils
- [ ] E2E tests: Cypress or Playwright
- [ ] Visual regression: Percy or similar

## Security

- ✅ CORS enabled for backend API
- ✅ HttpOnly cookies for tokens
- ✅ CSRF protection (backend)
- ✅ Input validation on frontend
- ✅ Role-based access control (RBAC)

## Future Improvements

1. Error boundaries for error handling
2. Service workers for offline mode
3. Strategic data caching
4. Integrated analytics
5. Dark mode support
