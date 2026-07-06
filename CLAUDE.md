# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint (`eslint .`)

There is no test suite configured in this project.

## Architecture

This is a React 19 + Vite SPA (no TypeScript) for "Multidukkan", a multi-tenant retail management app (products, orders, customers, suppliers, inventory, purchase orders, reports). Styling is Tailwind CSS.

**Backend**: a Laravel API at `http://multidukkan.test/api` (see [src/api/axios.js](src/api/axios.js)). A single shared axios instance (`api`) attaches the Bearer token from `localStorage` via a request interceptor and is imported into every page as `import api from '../api/axios'`. There is no other API layer — pages call `api.get/post/...` directly.

**Routing & auth** ([src/App.jsx](src/App.jsx)): all routes are declared flat in one `<Routes>` block, each wrapped individually in `<PrivateRoute>` (checks only for a token in localStorage) and `<Navbar>`/`<Layout>`. Auth/onboarding pages (`/login`, `/register`, `/onboarding`) are the exception and render without Navbar/Layout.

`AuthGate` wraps the whole app and runs on every route change: it calls `/me` to fetch fresh user data (avoiding stale localStorage) and redirects `tenant_admin` users without a store (`!u.has_store`) to `/onboarding`. It also owns global keyboard-shortcut wiring (`useKeyboardShortcuts`) and the `GlobalSearch` overlay. Any new top-level route should follow the existing `<PrivateRoute><Navbar /><Layout><Page /></Layout></PrivateRoute>` pattern unless it needs to be full-bleed (like invoice/print pages, which render standalone under `PrivateRoute` only).

**Toasts**: global toast state lives in `ToastProvider`/`useToast` ([src/hooks/useToast.jsx](src/hooks/useToast.jsx)), rendered once via `<Toast />` at the app root. Use `showToast(message, type)` instead of `alert()` or inline error banners — this replaced ad hoc error handling across pages.

**Page/component split**: `src/pages/` holds one component per route (list, detail, create, edit variants for each entity — Products, Customers, Suppliers, Orders, PurchaseOrders — plus print/invoice variants). `src/components/` holds shared building blocks (modals, search inputs per entity, `Layout`, `Navbar`). When adding a new entity, mirror the existing List/Detail/Create/Edit page naming and file layout already used for Products/Customers/Suppliers.

**Search inputs**: entity-specific typeahead components (`ProductSearchInput`, `CustomerSearchInput`, `SupplierSearchInput`) each wrap the generic `SearchInput` and hit their own API endpoint — follow this pattern rather than building a generic cross-entity search component (that's what `GlobalSearch` is for).



## Lint rules

- `no-unused-vars` is configured to ignore identifiers matching `^[A-Z_]` (e.g. unused destructured constants in caps) — see [eslint.config.js](eslint.config.js).
