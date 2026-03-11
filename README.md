# StayCare Frontend

Management web-application for StayCare-Group — handling orders, invoicing, route planning, and facility processing across multiple user roles.

---

## Tech Stack

| Layer            | Technology                                |
| ---------------- | ----------------------------------------- |
| Framework        | Vue 3 (Composition API, `<script setup>`) |
| Build tool       | Vite 7                                    |
| State management | Pinia 3                                   |
| Routing          | Vue Router 5                              |
| Styling          | Tailwind CSS 4 (Vite plugin)              |
| i18n             | vue-i18n 11 (English & Spanish)           |
| Maps             | Leaflet 1.9                               |
| Barcode scanning | @zxing/browser                            |
| Excel export     | SheetJS (xlsx)                             |
| Deployment       | Vercel                                    |

---

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (see `engines` in `package.json`)
- **npm** (ships with Node)
- The **StayCare backend** running on `http://localhost:3000` (or set `VITE_BACKEND_URL`)

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/<org>/StayCare-Frontend.git
cd StayCare-Frontend/StayCare

# 2. Install dependencies
npm install

# 3. Copy the env example and fill in values if needed
cp .env.example .env
#    If the backend is not running on localhost:3000, set VITE_BACKEND_URL in .env

# 4. Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173** by default.

---

## Available Scripts

| Command           | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR                    |
| `npm run build`   | Build for production into `dist/`                     |
| `npm run preview` | Serve the production build locally for a quick review |

---

## Environment Variables

All custom env vars must be prefixed with `VITE_` to be exposed to client code.

| Variable           | Default | Purpose                        |
| ------------------ | ------- | ------------------------------ |
| `VITE_BACKEND_URL` | `""`    | Base URL for all API requests  |

During development, Vite proxies `/api` requests to `http://localhost:3000` (configured in `vite.config.js`), so the env var is only needed when the backend runs elsewhere.

---

## Project Structure

```
StayCare/
├── public/                  # Static assets served as-is
├── src/
│   ├── api/                 # API client modules (fetch wrappers)
│   │   ├── client.ts        # Base apiFetch() wrapper (credentials, error handling)
│   │   ├── auth.ts          # Login, logout, refresh
│   │   ├── clients.ts       # Client CRUD
│   │   ├── facility.ts      # Facility endpoints
│   │   ├── invitations.ts   # Invitation management
│   │   ├── invoices.ts      # Invoice endpoints
│   │   ├── items.ts         # Item catalogue
│   │   ├── orders.ts        # Order CRUD
│   │   ├── routes.ts        # Route planning
│   │   └── users.ts         # User management
│   ├── Components/
│   │   ├── dashboard/       # Role-specific dashboard views
│   │   │   ├── AdminDashboard.vue
│   │   │   ├── ClientDashboard.vue
│   │   │   ├── DriverDashboard.vue
│   │   │   └── FacilityDashboard.vue
│   │   ├── layout/          # Sidebar, top header (desktop & mobile)
│   │   ├── pages/
│   │   │   ├── admin/       # Admin-only pages (orders, invoices, items, reports, users, routes)
│   │   │   ├── client/      # Client pages (orders, invoices)
│   │   │   ├── driver/      # Driver pages (route, pickup/delivery confirm, history)
│   │   │   ├── facility/    # Facility pages (reception, processing)
│   │   │   └── shared/      # Settings and other cross-role pages
│   │   └── ui/              # Reusable UI components (DataTable, KpiCard, MapPicker, etc.)
│   ├── data/                # Mock / seed data for local development
│   ├── i18n/                # Internationalisation (en.json, es.json)
│   ├── Pages/               # Top-level route pages (Login, Dashboard, etc.)
│   ├── stores/              # Pinia stores
│   │   ├── auth.js          # Authentication state & actions
│   │   ├── lang.js          # Language / locale state
│   │   └── nav.js           # Navigation / sidebar state
│   ├── App.vue              # Root component (just <router-view />)
│   ├── index.css            # Global CSS (Tailwind import + base styles)
│   ├── main.js              # App entry point (creates Vue app, plugins, auth refresh)
│   └── router.js            # Route definitions & navigation guards
├── index.html               # HTML shell
├── vite.config.js           # Vite + Tailwind + proxy config
├── vercel.json              # Vercel SPA rewrite rules
└── package.json
```

### Path Alias

`@` is aliased to `./src`, so you can import like:

```js
import { useAuthStore } from '@/stores/auth.js'
```

---

## Authentication

The app uses **httpOnly cookie-based auth** with a refresh-token flow:

1. On login, the backend sets secure cookies.
2. On every page load, `auth.tryRefresh()` is called **before** the app mounts to restore the session silently.
3. All API calls include `credentials: 'include'` via the `apiFetch()` wrapper in `src/api/client.ts`.
4. A `401` response automatically redirects to the login page.

---

## User Roles

The dashboard renders a different view depending on the authenticated user's role:

| Role       | Dashboard component    | Key pages                                         |
| ---------- | ---------------------- | ------------------------------------------------- |
| `admin`    | `AdminDashboard.vue`   | Order creation, invoicing, item mgmt, reports, route planner, user mgmt |
| `client`   | `ClientDashboard.vue`  | Create orders, view orders & invoices              |
| `driver`   | `DriverDashboard.vue`  | Route view, pickup/delivery confirmation, history  |
| `facility` | `FacilityDashboard.vue`| Reception, processing                              |

---

## Internationalisation (i18n)

- Supported locales: **English** (`en`) and **Spanish** (`es`).
- Translation files live in `src/i18n/en.json` and `src/i18n/es.json`.
- The user's language preference is persisted in `localStorage` (`staycare-lang`) and synchronised with their backend profile.
- To add a new locale, create a `<lang>.json` file in `src/i18n/`, import it in `src/i18n/index.js`, and add the key to the `messages` object.

---

## Deployment

The project is configured for **Vercel**:

- `vercel.json` rewrites all routes to `index.html` for SPA client-side routing.
- Run `npm run build` to produce the `dist/` folder, which Vercel serves.

---

## Contributing

1. Create a feature branch from `main`.
2. Follow existing conventions: Composition API with `<script setup>`, Tailwind utility classes, Pinia stores.
3. Keep API modules in `src/api/` — each domain gets its own file that imports `apiFetch` from `client.ts`.
4. Add translation keys to **both** `en.json` and `es.json` when adding user-facing text.
5. Test locally against the running backend before opening a PR.
