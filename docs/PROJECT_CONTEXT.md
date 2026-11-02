# StayCare Project Context

## Project objective

StayCare is an existing bilingual laundry management web application.

The application controls the complete lifecycle of laundry orders, including:

- Order creation
- Pickup
- Laundry facility reception
- Laundry processing
- Order completion
- Delivery

The project already exists and its current architecture must be preserved.

## Technology stack

### Frontend

- Vue 3
- Vite
- Tailwind CSS
- English and Spanish internationalization
- Existing state-management solution
- Existing routing solution
- UI Standards and Guidelines: consult [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md)

### Backend

- Node.js
- TypeScript
- REST APIs
- Authentication
- Role-based authorization
- MySQL
- Docker for the local environment only

## User roles

The application has the following roles:

- Admin
- Staff
- Operator
- Client
- Driver

Each role has different permissions, screens and allowed actions.

### Staff Role (`staff`)

- **Sidebar & Navigation**: Has access to **Dashboard** (`dashboard`), **Orders** (`orders`), **Reception** (`reception`), **Processing** (`processing`) and **Settings** (`settings`). Does not have access to **Routes** (`routes`) or **Users** (`users`).
- **Orders**: Can view all orders and their detail (`orders:read`, PDF download) and create orders (`orders:create`). Cannot edit orders (`EditOrderModal`), reschedule pickups (`reschedule`), cancel orders (`orders:delete`) or export CSVs (`exportOrdersFlat`, `exportOrdersStained`).
- **Reception & Processing**: Full access in **Reception** (`receiveAtFacility` / `receiveInPlant`) and **Processing** (all processing stage transitions, rollbacks, `QualityCheckModal` item condition updates during `quality_check`, and all machine management/assignments).
- **Routes & Driver Actions**: Cannot view or manage routes (`/api/routes`), reassign orders (`reassignOrder`), or confirm driver pickups/collections/deliveries (`confirmPickup`, `confirmCollection`, `confirmDelivery`).

### Operator Role (`operator`)

- **Sidebar & Navigation**: Has access only to **Processing** (`processing`, default screen) and **Settings** (`settings`), plus **Profile** (`profile`) from the top header.
- **Orders (`orders:read`)**: Can list and view orders on the processing board (`GET /api/orders`, `GET /api/orders/:id`). Cannot create, edit, reschedule, cancel or export orders.
- **Stage Transitions**: Can only advance orders from `ironing` to `quality_check` (`PATCH /api/orders/:id/status`). All other stage transitions, facility reception (`arrived`), quality-check completion (`quality_check → ready_to_delivery`) and rollbacks are restricted to `admin` and `staff`.
- **Machines**: Can view all plant machines (`GET /api/machines`), and can only assign or release **iron** machines (`type === 'iron'`) for orders currently in the `ironing` stage (`POST /api/machines/:id/assign`, `POST /api/machines/:id/release`). Cannot create, edit or delete machines.

### Client Sub-Users and Custom Roles

Clients can create custom roles (e.g. "Order Manager") with granular permissions
(`orders:create`, `orders:read`, `orders:update`, `orders:delete`) and assign them
to sub-users (employees) under their account.

Sub-users authenticate with the same login flow. Their JWT includes:
- `parentClientId`: the owning client's user ID
- `permissions`: array of permission names from their assigned custom role

The `ClientSubUsersManager` component (shared between admin and client views) manages
both roles and sub-users in a single panel.

Database tables involved: `roles` (`client_id`, `is_system`), `permissions`,
`role_permissions`, `users.parent_client_id`.

The existing frontend and backend implementations are the source of truth
for the exact permissions.

## Order flows

Orders can follow route-based or manual flows.

### Route-based pickup

A route-based pickup can involve:

1. Pickup preparation
2. Route and driver assignment
3. Driver pickup confirmation
4. Reception by staff at the laundry facility

### Manual pickup

A manual pickup does not require:

- A driver
- A route
- A route stop

The exact order-status transition used by the manual pickup flow must be
confirmed from the existing backend logic, frontend implementation and
database values.

Do not assume that manual pickup follows the same transitions as a
route-based pickup.

### Laundry processing

After reception at the facility, the order moves through the existing
laundry-processing stages until it is completed and ready for delivery.

The exact processing stages and permitted transitions must be discovered
from the current implementation.

### Route-based delivery

A route-based delivery can involve:

1. Delivery preparation
2. Route and driver assignment
3. Driver delivery
4. Final delivery confirmation

### Manual delivery

A manual delivery does not require:

- A driver
- A route
- A route stop

The exact confirmation action and resulting order status must be confirmed
from the current implementation.

## Sources of truth

Use the following sources to understand the current behavior:

1. Backend business logic and authorization
2. Database schema and stored status values
3. Enums, constants and types
4. API contracts
5. Frontend implementation
6. This documentation

When the documentation conflicts with the implementation, report the
conflict instead of silently changing the system.