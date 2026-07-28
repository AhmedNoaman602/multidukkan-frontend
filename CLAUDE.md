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

**Routing & auth** ([src/App.jsx](src/App.jsx)): all routes are declared flat in one `<Routes>` block, each wrapped individually in `<PrivateRoute>` (checks only for a token in localStorage) and `<Sidebar>`/`<Layout>`. Auth/onboarding pages (`/login`, `/register`, `/onboarding`) are the exception and render without Sidebar/Layout.

`AuthGate` wraps the whole app and runs on every route change: it calls `/me` to fetch fresh user data (avoiding stale localStorage) and redirects `tenant_admin` users without a store (`!u.has_store`) to `/onboarding`. It also owns global keyboard-shortcut wiring (`useKeyboardShortcuts`) and the `GlobalSearch` overlay. Any new top-level route should follow the existing `<PrivateRoute><Sidebar /><Layout><Page /></Layout></PrivateRoute>` pattern unless it needs to be full-bleed (like invoice/print pages, which render standalone under `PrivateRoute` only).

**Toasts**: global toast state lives in `ToastProvider`/`useToast` ([src/hooks/useToast.jsx](src/hooks/useToast.jsx)), rendered once via `<Toast />` at the app root. Use `showToast(message, type)` instead of `alert()` or inline error banners — this replaced ad hoc error handling across pages.

**Page/component split**: `src/pages/` holds one component per route (list, detail, create, edit variants for each entity — Products, Customers, Suppliers, Orders, PurchaseOrders — plus print/invoice variants). `src/components/` holds shared building blocks (modals, search inputs per entity, `Layout`, `Sidebar`). When adding a new entity, mirror the existing List/Detail/Create/Edit page naming and file layout already used for Products/Customers/Suppliers.

**Search inputs**: entity-specific typeahead components (`ProductSearchInput`, `CustomerSearchInput`, `SupplierSearchInput`) each wrap the generic `SearchInput` and hit their own API endpoint — follow this pattern rather than building a generic cross-entity search component (that's what `GlobalSearch` is for).

## i18n (English / Arabic)

Hand-rolled, no dependency. Three modules under `src/i18n/`, split so the provider file exports only a component (`react-refresh/only-export-components`):

- [src/i18n/translate.js](src/i18n/translate.js) — pure resolver, `DEFAULT_LANG` (`'ar'`), `LANGUAGES`, the `lang` localStorage key. Missing keys return the key itself and `console.warn` in dev.
- [src/i18n/useTranslation.js](src/i18n/useTranslation.js) — the context and the hook every component imports.
- [src/i18n/index.jsx](src/i18n/index.jsx) — `LanguageProvider`, mounted in [src/main.jsx](src/main.jsx) above `QueryClientProvider` so switching language never remounts the tree.

```js
const { t, lang, dir, setLang } = useTranslation()
t('common.save')                              // "Save" / "حفظ"
t('common.pageOf', { page: 2, total: 7 })     // {name} interpolation
t(`enums.expenseCategory.${expense.category}`) // backend enum -> display label
```

Strings live in `src/i18n/{en,ar}/<namespace>.js` — `common`, `navigation`, `enums`, `auditLog`, `dashboard`, `expenses`, `orders`, `search`, `products`, `customers`, `auth` so far. Register each new namespace in both `en/index.js` and `ar/index.js`. A string used by more than one feature belongs in `common`; never duplicate it into a feature namespace — if a page-specific string turns out to be needed by a second feature later (as happened with `quickSale`, `invoice`, `items`, `paymentsCount`), promote it to `common` and update both call sites rather than leaving a duplicate.

**Direction**: `LanguageProvider` sets `document.documentElement.lang`/`dir` and the title on change; an inline script in [index.html](index.html) applies the stored language before first paint to avoid an RTL flash. The app is already written with logical Tailwind utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `border-s/e`, `start-0`) — keep it that way and never introduce `ml-*`/`mr-*`/`text-left`/`text-right`. Physical props that must follow direction (e.g. `<SheetContent side>`, pagination chevrons) read `dir` from the hook. Never bake `←`/`→` into a translated string.

**Never translate**: user-entered data (product/customer/store names, SKUs, notes), or the enum *values* sent to the API. `src/lib/enums.js` holds the canonical ordered value lists; only their display goes through `t()`.

**Formatting**: [src/lib/format.js](src/lib/format.js) — `formatCurrency(value, lang)`, `formatNumber`, `formatDate(value, lang, options)`, `formatDateTime(value, lang)`. Both languages use Western numerals (`ar-EG-u-nu-latn`); only the currency symbol and month/weekday names change. Where the currency symbol is a separately styled sibling `<span>`, use `formatNumber` + `t('common.currency')` rather than `formatCurrency`, so the markup is preserved.

**Arabic voice**: professional Arabic for labels/navigation, Egyptian-leaning for messages and confirmations (`حصلت مشكلة…`, `مفيش…`), masdar buttons (`حفظ`، `إلغاء`، `تعديل`، `حذف`، `إضافة`).

**Migration status**: migrated so far — `Sidebar`, `Expenses`/`ExpenseModal`, `Dashboard`, `AuditLog`/`AuditLogDrawer`, `Orders`/`OrderDetail`/`CreateOrder`, `Products`/`CreateProduct`/`EditProduct`, `Customers`/`CreateCustomer`/`EditCustomer`, `Login`/`Register`, and all enum labels.

`Login`/`Register` render outside `PrivateRoute`'s `Sidebar`, so they can't rely on the switcher living there — `LanguageSwitcher` now takes an optional `className` prop (default `''`) instead of a baked-in margin, and both auth pages mount their own copy in a `fixed top-4 end-4` corner so the language can be changed before signing in. `Sidebar.jsx` passes `className="mb-2"` explicitly to preserve its original spacing. Shared components `DeleteModal`, `BackButton`, `ProductSearchInput`, `CustomerSearchInput`, `SupplierSearchInput`, and `SearchInput` are also migrated — these are mounted on several still-unmigrated pages (`SupplierBalance`, `CreatePurchaseOrder`, `QuickSaleModal`, `AddItemModal`, `Inventory`, `Suppliers`), so fixing the text *inside* them was safe regardless of the calling page's migration status. When a shared/reusable component takes a `placeholder`-style prop with a hardcoded-Arabic default, check every caller — a caller that doesn't pass the prop silently inherits whatever language the component's own default resolves to (this is exactly how a bug slipped through initially: `CreateOrder.jsx` never passed a `placeholder` to `CustomerSearchInput`, so it silently showed Arabic even in English mode — always search for every consumer of a shared component, not just the page you're actively migrating). Migrating `CreateProduct`/`CreateCustomer` also surfaced several pre-existing strings that were stray hardcoded **English** inside the Arabic UI (`Supplier`, `Opening Quantity`, `Cost Price`, `Name`, `Phone` labels) — worth grepping for latin text inside otherwise-Arabic files when migrating a page, not just Arabic text. Every other page still has hardcoded Arabic; next up are Inventory, Suppliers, and the supplier Create/Edit pages.

Two deprecated shims keep unmigrated pages working by re-exporting the Arabic bundle — delete each once nothing imports it:
- `roleLabels`/`paymentMethodLabels`/`paymentReferenceLabels`/`expenseCategoryLabels` in [src/lib/labels.js](src/lib/labels.js)
- `typeLabels` in [src/lib/auditLog.js](src/lib/auditLog.js) (used by `CustomerBalance` and `SupplierBalance`)

ESLint does not check cross-module imports, so removing an export from either file passes lint and only fails at `npm run build` — always run the build after touching them.

When migrating a page, also sweep its inline `ج.م` and `toLocaleDateString`/`toLocaleString` calls onto `format.js`, and replace any `'→ السابق'` / `'التالي ←'` pagination with direction-aware chevrons.

## Lint rules

- `no-unused-vars` is configured to ignore identifiers matching `^[A-Z_]` (e.g. unused destructured constants in caps) — see [eslint.config.js](eslint.config.js).
