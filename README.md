# MultiDukkan — Frontend

MultiDukkan is a multi-tenant POS and inventory management system for small retail businesses. One business can run several stores and warehouses, sell in multiple units, track customer credit, and purchase from suppliers.

This repository contains the **React frontend**. It is a single-page application with no server-side rendering: it talks to the [Laravel REST API backend](https://github.com/AhmedNoaman602/multidukkan) and nothing else. Arabic is the default interface language.

---

## Tech Stack

| | |
|---|---|
| **React** | 19.2 |
| **Vite** | 8.0 |
| **Language** | JavaScript (ES modules) — no TypeScript |
| **React Router** | 7.13 |
| **TanStack Query** | 5.101 |
| **Axios** | 1.14 |
| **Tailwind CSS** | 3.4 |
| **Radix UI** | avatar, dialog, slot, toggle, toggle-group |
| **Recharts** | 3.8 — report charts |
| **Lucide React** | icons |
| **Auth** | Laravel Sanctum bearer tokens, attached by the Axios client |

---

## Architecture

```
React Page
    ↓
TanStack Query / Axios
    ↓
Laravel REST API
    ↓
Controllers → Services → Models
    ↓
MySQL
```

**Pages** (`src/pages/`) — one component per route, following a List / Detail / Create / Edit naming pattern per entity, plus standalone print and invoice views.

**Reusable components** (`src/components/`) — modals, per-entity search inputs, `Layout`, `Sidebar`, toasts, and a small set of Radix-based UI primitives in `src/components/ui/`.

**API layer** (`src/api/axios.js`) — a single Axios instance is the only path to the backend; no component imports Axios or calls `fetch` directly. A request interceptor attaches the bearer token, the active locale as `X-Locale`, and the browser's IANA timezone as `X-Timezone`.

**Server state** — TanStack Query owns everything read from the API; component state holds only UI concerns. Writes are made directly through the shared Axios client and then invalidate the affected query keys.

**Authentication** — the token and user are stored in `localStorage` at login. An `AuthGate` component re-fetches `/me` on every route change rather than trusting that cached copy, so role and onboarding state stay correct after they change server-side.

**Authorization** — `PrivateRoute` gates on the presence of a token; `RoleRoute` takes a capability predicate from `src/lib/permissions.js`.

**Internationalization** (`src/i18n/`) — a hand-written translation layer, no i18n library.

---

## Authentication & Authorization

Three tenant roles, matching the backend:

| Role | Scope |
|---|---|
| `tenant_admin` | Full access across the whole business |
| `store_manager` | Full access within their own store |
| `store_staff` | Day-to-day selling: orders, payments, read-only inventory and products |

**Authorization is enforced by the Laravel backend** through policies and capability gates. The frontend mirrors those rules purely so the interface does not offer actions the API would reject — hiding a route or a column in React is a user-experience decision, not a security boundary.

Currently reflected in the client:

- **Route guards** — reports and the report print view, and all supplier and purchase-order routes, are wrapped in `RoleRoute` and redirect to the dashboard for users without the matching capability.
- **Navigation visibility** — the sidebar omits links to areas the user cannot open.
- **Conditional UI** — cost price and profit margin columns are hidden on the product list, the product detail page, and the order profit summary for users without cost-data access.

`src/lib/permissions.js` holds the two predicates the client checks, deliberately mirroring the server's `view-cost-data` and `view-reports` gates.

---

## Internationalization

**Arabic and English**, with Arabic as the default. Translations live in `src/i18n/{ar,en}/`, split across 20 namespace files per language.

A `LanguageProvider` mounted above the app owns the active language and keeps `<html lang>` and `<html dir>` in sync with it, so Arabic renders right-to-left. Components branch on direction where layout depends on it — icon direction, drawer and sheet placement. The choice persists in `localStorage`.

Two headers travel with every request so the backend can respond correctly:

- `X-Locale` — the active language, so validation and error messages come back translated.
- `X-Timezone` — the browser's IANA timezone, so date filters mean the user's calendar day. Timestamps themselves remain UTC end to end.

---

## Development

**Requirements:** Node.js and a running [MultiDukkan API](https://github.com/AhmedNoaman602/multidukkan).

```bash
npm install      # install dependencies
npm run dev      # development server (Vite, port 5174)
npm run build    # production build
npm run preview  # preview the production build locally
npm run lint     # ESLint
```

The API base URL is currently hardcoded to `http://multidukkan.test/api` in `src/api/axios.js`. Change it there if you serve the backend from a different address.

---

## Backend

The Laravel API lives in a separate repository: **[AhmedNoaman602/multidukkan](https://github.com/AhmedNoaman602/multidukkan)**

It holds the REST API and domain architecture, the MySQL schema and migrations, multi-tenancy enforcement, the authorization policies and gates this client mirrors, the inventory and financial logic (an append-only ledger and inventory transaction log), and the automated test suite.

---

## Project Status

MultiDukkan is an **active development project**, built for a real family retail business. It is not deployed, has no users, and has no CI pipeline.

Known gaps in this repository:

- No automated frontend tests. The suite of checks is `npm run build` and `npm run lint`.
- The API base URL is hardcoded rather than read from an environment variable.
- The production bundle is not code-split.
