# StayCare - Frontend

Laundry management system - Vue 3 application with modern interface for clients, administrators, drivers, and facility staff.

## Description

StayCare is a complete laundry order management platform that enables:
- **Clients**: Create orders, track deliveries, pay invoices
- **Administrators**: Manage users, clients, pricing and reports
- **Drivers**: View assigned routes, confirm pickups and deliveries
- **Facility Staff**: Process orders via Kanban board, assign machines, manage equipment

## Technologies

- **Vue 3** - Progressive frontend framework
- **Composition API** - Modern reactive logic
- **Vite** - Fast build tool
- **Vue Router** - Single-page application routing
- **Pinia** - State management
- **Vue-i18n** - Internationalization (Spanish/English)
- **Tailwind CSS** - CSS utilities
- **Axios** - HTTP client

## Project Structure

```
src/
├── api/                    # API functions
│   ├── users.ts           # Users API (use role=client for clients)
│   ├── facility.ts        # Machines and processing API
│   └── ...
├── Components/            # Vue components
│   ├── dashboard/         # Dashboards by role
│   ├── pages/            # Main pages
│   │   ├── admin/        # Admin pages
│   │   ├── facility/     # Facility pages (Processing, Reception)
│   │   ├── driver/       # Driver pages
│   │   └── shared/       # Shared components
│   └── ui/               # Reusable UI components
├── i18n/                 # Translation files
│   ├── es.json          # Spanish
│   └── en.json          # English
├── stores/              # Pinia stores
│   ├── auth.js         # Authentication and user
│   ├── nav.js          # Navigation
│   └── ui.js           # Notifications and UI
├── utils/              # Utility functions
└── types/              # TypeScript types
```

## Key Features

### Facility - Processing Flow
- **Visual Kanban** with order states: Received → Washing → Drying → Ironing → Quality Check → Ready
- **Machine Management**:
  - View machine status (Available, In Use, Maintenance)
  - Add new machines
  - Edit existing machines
  - Delete machines
  - Assign machines to orders
- **Flow**: When assigning a machine, the order automatically advances to the next state
- **Permission Control**: Admin and staff can manage machines

### Client Management
- Client profile with company information
- Order creation restriction for incomplete profiles
- Data validation: phone, contact person, billing address
- Editing payment terms and pricing tier (admin)

### Driver Dashboard
- View of assigned routes
- Delivery history with date filtering
- Pickup and delivery confirmation with photos

### Internationalization
- Full support for Spanish and English
- Language switching without page reload
- Consistent translations throughout the application

### Notification System
- Elegant toasts for success, error, and confirmation
- Contextual messages
- Automatic disappearance timing

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```sh
npm install
```

### Environment Variables

Create `.env.local` file:
```
VITE_API_URL=http://localhost:3000
```

## Development

### Development Server

```sh
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```sh
npm run build
```

## Authentication

The application implements authentication via:
- password
- Secure cookies
- JWT tokens (backend)
- Roles: admin, client, driver, staff

## API Integration

The frontend communicates with the backend at:
- Machines: `GET/POST/PUT/DELETE /api/machines`
- Orders: `GET/POST /api/orders`
- Users: `GET/PUT /api/users`
- Routes: `GET /api/routes`

## Development Guide

### Adding a Translation

1. Edit `src/i18n/es.json` and `src/i18n/en.json`
2. Use in components: `$t('section.key')`

### Creating a Component

```vue
<template>
  <div>{{ message }}</div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('Hello')
</script>
```

### Using Pinia Store

```js
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const user = auth.user
```

### API Call

```js
import { apiFetch } from '@/api/client'

const data = await apiFetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ /* data */ })
})
```

## Role Glossary

| Role | Functions |
|------|-----------|
| **Admin** | User management, clients, machines, orders, reports |
| **Client** | Create orders, view history, pay invoices |
| **Driver** | View routes, confirm pickups/deliveries, history |
| **Staff** | Process orders, manage machines, processing board |

## Recommended IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Recommended Browsers

- Chrome, Edge, Brave (with Vue DevTools)
- Firefox (with Vue DevTools)

## Support

For error reports or feature requests, contact the development team.
