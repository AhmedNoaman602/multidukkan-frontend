# The MultiDukkan Bilingual (English/Arabic) System — A Complete Learning Guide

This document exists to teach one person — a beginner who knows basic JavaScript and React but is still learning how real systems fit together — exactly how the language-switching system in this project works, using nothing but the actual, current source code.

Every code block in this document is the **real file**, copied exactly as it exists in the project right now. Nothing has been simplified, shortened, or invented for teaching purposes. If a line looks trivial, it is still included and still explained, because in a real codebase the "trivial" lines are often the ones that prevent bugs.

---

## How this document is organized

1. **File-by-file documentation** — every file in the system, one at a time, in the order data actually flows through them (not alphabetical order).
2. **COMPLETE DATA FLOW** — the whole system traced as sixteen real events, from opening the browser to text appearing on screen.
3. **LANGUAGE SWITCH JOURNEY** — one specific example: the user is in Arabic, clicks English, and we trace every line of code that runs.
4. **RTL AND LTR** — why changing one HTML attribute rearranges an entire page.
5. **THE TRANSLATION LOOKUP JOURNEY** — the dictionary-lookup mechanism, traced key by key.
6. **ARCHITECTURE DIAGRAM** — the whole system as one picture.
7. **FILE RELATIONSHIP DIAGRAM** — which file imports which.
8. **VARIABLE OWNERSHIP** — a table of every important variable and exactly which file owns it.
9. **BEGINNER EXPLANATIONS** — every JavaScript/React concept used in this system, explained with the real line of code that uses it.
10. **TEST YOUR UNDERSTANDING** — questions to check comprehension.

---

# PART 1 — FILE-BY-FILE DOCUMENTATION

## `index.html`

### Purpose, in simple language

This is the very first file the browser reads — before any JavaScript, before React, before anything. Its job here is to make sure the page starts out looking correct (right language, right reading direction) even in the brief moment before React has had a chance to load and take over.

### Complete current source code

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>MultiDukkan</title>
    <script>
      // Apply the saved language before first paint so the page never flashes
      // in the wrong direction. React takes over from here (see src/i18n).
      // The static lang/dir on <html> above is the no-JS default (Arabic).
      (function () {
        try {
          var lang = localStorage.getItem('lang')
          if (lang !== 'en' && lang !== 'ar') return
          document.documentElement.lang = lang
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
        } catch (e) {}
      })()
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Explained group by group

**`<html lang="ar" dir="rtl">`**
This is the static, hardcoded default. Before any JavaScript runs at all, the browser already knows: "this page is in Arabic, and it flows right-to-left." This is the safety net — if a visitor has never used the app before (so there's nothing saved yet), or if JavaScript somehow fails to run, this is what they get: Arabic, right-to-left, which matches the app's original design.

**`<title>MultiDukkan</title>`**
The text shown in the browser tab. It's the same in both languages (confirmed by `src/i18n/translate.js`, where `titles = { en: 'MultiDukkan', ar: 'MultiDukkan' }`), so this line never needs to change at runtime.

**The `<script>` block — the bootstrap script**

```js
(function () {
  try {
    var lang = localStorage.getItem('lang')
    if (lang !== 'en' && lang !== 'ar') return
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  } catch (e) {}
})()
```

This is plain JavaScript — no React, no imports, nothing fancy — and it runs the instant the browser reaches this point in the HTML, before the page has even fully loaded. Line by line:

- `(function () { ... })()` — wraps the code in a function and calls it immediately. This keeps the variable `lang` from leaking out and possibly clashing with some other script on the page.
- `var lang = localStorage.getItem('lang')` — reads the browser's saved notebook entry for `'lang'`. This could come back `'en'`, `'ar'`, or `null` (if nobody has ever set it).
- `if (lang !== 'en' && lang !== 'ar') return` — a safety check. If the stored value is `null`, or garbage from some other bug, stop here and do nothing. Because Arabic/RTL is already the static default above, "doing nothing" is the same as "choosing Arabic."
- `document.documentElement.lang = lang` and `document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'` — if a valid saved language was found, override the static default immediately, before the page is shown to the user.
- `try { ... } catch (e) {}` — some browsers (particularly in strict privacy modes) can throw an error just from touching `localStorage`. This makes sure that if that happens, the script fails silently rather than breaking page load entirely.

### What imports this file

Nothing "imports" `index.html` in the JavaScript sense — it's the entry point the browser loads directly when you visit the site.

### What this file imports

It loads `src/main.jsx` as a module:
```html
<script type="module" src="/src/main.jsx"></script>
```
This is the line that hands control over to React.

### What data enters this file

The value stored under the `'lang'` key in the browser's `localStorage` (a string: `'en'`, `'ar'`, or nothing at all).

### What data leaves this file

Two attributes it sets directly on the `<html>` tag (`lang` and `dir`), which persist until React's `LanguageProvider` takes over (and confirms or corrects them).

---

## `src/main.jsx`

### Purpose, in simple language

This is where the React application actually starts. Its job here is to wrap the entire app in `LanguageProvider`, so that every component anywhere in the app tree can access the current language.

### Complete current source code

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { LanguageProvider } from './i18n'
import App from './App.jsx'
import './index.css'

window.history.scrollRestoration = 'manual'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LanguageProvider>
            <QueryClientProvider client={queryClient}>
                <App />
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </LanguageProvider>
    </StrictMode>,
)
```

### Explained group by group

**The imports at the top** bring in everything this file needs: React's `StrictMode` (a development helper that catches certain bugs), `createRoot` (the function that actually draws React onto the page), the React Query providers (used for API data caching, unrelated to i18n), and — the important one for us — `LanguageProvider` from `./i18n`.

**`createRoot(document.getElementById('root')).render(...)`**
`document.getElementById('root')` finds the empty `<div id="root"></div>` from `index.html`. `createRoot(...)` tells React "this is the box I'm allowed to draw inside." `.render(...)` is where we hand React the actual tree of components to draw.

**The nesting order — this is the important part:**

```jsx
<LanguageProvider>
    <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
</LanguageProvider>
```

`LanguageProvider` is the **outermost** wrapper — everything else, including the entire rest of the app, sits inside it. This matters for two reasons:

1. Only things *inside* a Provider can read what it's broadcasting. Putting `LanguageProvider` at the very top means every single component in the app — no matter how deeply nested — can reach it.
2. It sits *outside* `QueryClientProvider` on purpose. If it were nested the other way around, a language change could in theory cause the API data cache to be thrown away and rebuilt. With `LanguageProvider` on the outside, switching languages only ever re-runs components — it never destroys and rebuilds the React Query cache, which is why switching languages on the Expenses page doesn't cause the table to flicker or refetch.

### What imports this file

Nothing imports `main.jsx` — it's the JavaScript entry point, loaded directly by `index.html`.

### What this file imports

`LanguageProvider` (from `./i18n`, which resolves to `src/i18n/index.jsx`), `App` (the whole application's routes), plus React and React Query setup.

### What data enters this file

Nothing dynamic — this file runs once, when the page first loads.

### What data leaves this file

A fully assembled React component tree, handed to `createRoot(...).render(...)`, with `LanguageProvider` wrapped around everything.

---

## `src/i18n/translate.js`

### Purpose, in simple language

This file is the "dictionary machine." It does not know about buttons, screens, or clicks — it only knows how to take a language and a key (like `'expenses.title'`) and return the correct word. It is deliberately written with **no React** in it at all, so that other non-React code (like `src/lib/format.js`) can also use it.

### Complete current source code

```js
// Pure translation layer — no React. Components should use useTranslation()
// instead of calling translate() directly; this module exists for the few
// callers outside the tree (e.g. lib/format.js) and to keep the provider file
// free of non-component exports.

import en from './en'
import ar from './ar'

const bundles = { en, ar }

// Arabic stays the default: every existing user's UI is unchanged after deploy.
// Deliberately no browser-language detection — a browser set to English would
// silently flip an Arabic user's UI. Change this one constant to flip the default.
export const DEFAULT_LANG = 'ar'

export const LANGUAGES = ['en', 'ar']

// Keep in sync with the inline bootstrap script in index.html.
export const STORAGE_KEY = 'lang'

export const titles = { en: 'MultiDukkan', ar: 'MultiDukkan' }

export function readStoredLang() {
    const stored = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.includes(stored) ? stored : DEFAULT_LANG
}

// Dot-path lookup into a bundle: 'expenses.form.amount' -> bundle.expenses.form.amount
const lookup = (bundle, key) =>
    key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), bundle)

// Replace {name} placeholders. React escapes the result on render.
const interpolate = (template, params) =>
    params
        ? template.replace(/\{(\w+)\}/g, (match, name) =>
              params[name] === undefined ? match : String(params[name]),
          )
        : template

export function translate(lang, key, params) {
    const value = lookup(bundles[lang], key)

    if (typeof value !== 'string') {
        if (import.meta.env.DEV) {
            console.warn(`[i18n] missing key "${key}" for lang "${lang}"`)
        }
        // Return the key so a gap is visible in the UI but never crashes a page.
        return key
    }

    return interpolate(value, params)
}
```

### Explained group by group

**`import en from './en'` / `import ar from './ar'`**
These pull in the entire English and Arabic word libraries. `./en` and `./ar` are folders, each with their own `index.js` that gathers all the smaller files inside them (explained later in this document) into one big object.

**`const bundles = { en, ar }`**
Now both entire languages are sitting in one object, reachable by name:
```js
bundles.en   // the whole English word library
bundles.ar   // the whole Arabic word library
```

**`export const DEFAULT_LANG = 'ar'`**
The single most important constant in the whole system. If nobody has picked a language yet, this is what they get. It is `'ar'` on purpose — every existing user of the app, before this feature existed, was already using it in Arabic. Making Arabic the default means deploying this feature changes nothing for anyone who doesn't explicitly go looking for the English option.

**`export const LANGUAGES = ['en', 'ar']`**
The list of every language this app actually supports. Used as a safety check elsewhere — "is this value one of the two languages we actually have a dictionary for?"

**`export const STORAGE_KEY = 'lang'`**
The exact name used when reading and writing to `localStorage`. Defining it once as a constant, instead of typing the string `'lang'` in multiple places, means there's no risk of a typo in one spot causing the save and the read to silently disagree.

**`export const titles = { en: 'MultiDukkan', ar: 'MultiDukkan' }`**
The browser tab title for each language. Currently identical for both, but this is where you'd add a difference if you ever wanted one.

**`readStoredLang()`**
```js
export function readStoredLang() {
    const stored = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.includes(stored) ? stored : DEFAULT_LANG
}
```
Reads whatever is saved in `localStorage`. If it's a real, valid language (`'en'` or `'ar'`), use it. Otherwise — nothing saved yet, or the value is somehow corrupted — fall back to `DEFAULT_LANG`. This function is what `LanguageProvider` calls the very first time the app boots, to decide the starting language.

**`lookup(bundle, key)`**
```js
const lookup = (bundle, key) =>
    key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), bundle)
```
This is the actual dictionary-walking logic. `key.split('.')` turns a string like `'expenses.title'` into a list: `['expenses', 'title']`. `.reduce(...)` then walks that list one piece at a time, going one folder deeper into `bundle` at each step. The `node == null ? undefined : node[part]` part is a safety guard: if at any point the path leads somewhere that doesn't exist, stop and return `undefined` instead of crashing.

**`interpolate(template, params)`**
```js
const interpolate = (template, params) =>
    params
        ? template.replace(/\{(\w+)\}/g, (match, name) =>
              params[name] === undefined ? match : String(params[name]),
          )
        : template
```
This fills in the `{page}`-style placeholders inside a sentence. If no `params` were passed at all, it skips the work entirely and returns the sentence unchanged. Otherwise, it finds every `{word}` pattern and replaces it with the matching value from `params` — or, if that value is missing, leaves the placeholder text visible (so a mistake shows up as ugly-but-obvious text, not a silent blank).

**`translate(lang, key, params)`** — the function everything else calls
```js
export function translate(lang, key, params) {
    const value = lookup(bundles[lang], key)

    if (typeof value !== 'string') {
        if (import.meta.env.DEV) {
            console.warn(`[i18n] missing key "${key}" for lang "${lang}"`)
        }
        return key
    }

    return interpolate(value, params)
}
```
This ties the two helper functions together: look up the key in the correct language's bundle, then check the result is actually a string (not `undefined` from a typo, and not an entire nested object from stopping halfway). If something's wrong, warn about it during development and return the raw key itself, so the page keeps working. If everything's fine, run it through `interpolate` and return the final text.

### What imports this file

`src/i18n/index.jsx` (the provider, to build the `t` function) and `src/lib/format.js` (to look up the currency symbol without needing to be inside a React component).

### What this file imports

`src/i18n/en/index.js` and `src/i18n/ar/index.js` — the two complete word libraries.

### What data enters this file

A language code (`'en'` or `'ar'`), a dot-separated key string, and an optional object of values to fill into placeholders.

### What data leaves this file

A single string of display text — either the correctly translated (and filled-in) sentence, or, if something went wrong, the raw key itself as a visible fallback.

---

## `src/i18n/useTranslation.js`

### Purpose, in simple language

This is the smallest file in the whole system. Its only job is to give components a way to "tune in" to whatever language is currently active, without needing that value passed down manually through every parent component.

### Complete current source code

```js
import { createContext, useContext } from 'react'

export const LanguageContext = createContext(null)

// The one hook every component uses:
//   const { t, lang, dir, setLang } = useTranslation()
export function useTranslation() {
    return useContext(LanguageContext)
}
```

### Explained line by line

**`import { createContext, useContext } from 'react'`**
Pulls in two built-in React tools. `createContext` reserves a "channel" that values can be broadcast on. `useContext` lets a component tune in to that channel from anywhere in the tree.

**`export const LanguageContext = createContext(null)`**
Creates the channel itself. The `null` is what a component would get if it tried to tune in and nobody was broadcasting anything — a safe default that means "nothing here."

**`export function useTranslation()`**
```js
export function useTranslation() {
    return useContext(LanguageContext)
}
```
This is a tiny wrapper function. Instead of every component having to write `useContext(LanguageContext)` and remember exactly which context object to use, they can just call `useTranslation()`. It hides the underlying context object behind a friendlier, self-explanatory name.

### What imports this file

Every component that needs to read the language or call `t()`: `LanguageSwitcher.jsx`, `Sidebar.jsx`, `Expenses.jsx`, `ExpenseModal.jsx`, `Dashboard.jsx`, `AuditLog.jsx`, `AuditLogDrawer.jsx`. Also `src/i18n/index.jsx` itself, which needs `LanguageContext` to build the actual Provider.

### What this file imports

Only React's built-in `createContext` and `useContext` — nothing from elsewhere in this project.

### What data enters this file

Nothing dynamic. It's pure setup code that runs once when the module is first loaded.

### What data leaves this file

The `LanguageContext` object itself (used by `index.jsx` to build the Provider), and the `useTranslation` function (used by every component that wants to read the current language).

---

## `src/i18n/index.jsx`

### Purpose, in simple language

This is the "control room." It's the one place in the entire app that actually holds the current language in memory, knows how to change it, and keeps the page's `<html>` tag in sync with it. Everything else in the system either feeds into this file or reads out of it.

### Complete current source code

```jsx
import { useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './useTranslation'
import { STORAGE_KEY, LANGUAGES, readStoredLang, titles, translate } from './translate'

// Owns the active language and keeps <html lang/dir> and the document title in
// sync with it. Mounted once in main.jsx, above everything else, so changing
// language re-renders the tree without remounting or reloading.
export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(readStoredLang)

    const dir = lang === 'ar' ? 'rtl' : 'ltr'

    useEffect(() => {
        document.documentElement.lang = lang
        document.documentElement.dir = dir
        document.title = titles[lang]
    }, [lang, dir])

    const value = useMemo(() => {
        const setLang = (next) => {
            if (!LANGUAGES.includes(next)) return
            localStorage.setItem(STORAGE_KEY, next)
            setLangState(next)
        }

        return {
            lang,
            dir,
            setLang,
            t: (key, params) => translate(lang, key, params),
        }
    }, [lang, dir])

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
```

### Explained group by group

**The imports**
`useEffect`, `useMemo`, `useState` from React — the three tools this file uses to manage state and side effects. `LanguageContext` from `useTranslation.js` — the channel this file will broadcast on. Five things from `translate.js` — the constants and the lookup function this file needs.

**`const [lang, setLangState] = useState(readStoredLang)`**
This is where the current language is actually *stored in memory*. `useState` creates one slot of memory that React watches. `readStoredLang` (the function itself, not its result) is passed in as the *starting value* — React calls it once, the very first time this component runs, to figure out what language to start with (which checks `localStorage`, falling back to `'ar'` if nothing is saved).

`lang` is the current value. `setLangState` is the *only* way to change it — and notice it is not exported or handed out directly to any component. Nothing outside this file can call `setLangState` directly.

**`const dir = lang === 'ar' ? 'rtl' : 'ltr'`**
The reading direction is *calculated* from `lang`, not stored separately. This is deliberate — if `dir` were its own separate piece of state, it would be possible (through a bug) for `lang` and `dir` to disagree with each other. By calculating it fresh every time, that becomes impossible.

**The `useEffect` block**
```js
useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    document.title = titles[lang]
}, [lang, dir])
```
`useEffect` lets this file reach *outside* of React's normal world and touch the actual `<html>` tag directly — something React doesn't manage on its own. The `[lang, dir]` at the end tells React: "only run this again if `lang` or `dir` has actually changed since last time" — so it doesn't run pointlessly on every unrelated re-render.

**The `value` object, built with `useMemo`**
```js
const value = useMemo(() => {
    const setLang = (next) => {
        if (!LANGUAGES.includes(next)) return
        localStorage.setItem(STORAGE_KEY, next)
        setLangState(next)
    }

    return {
        lang,
        dir,
        setLang,
        t: (key, params) => translate(lang, key, params),
    }
}, [lang, dir])
```

This is the object that gets broadcast to every component in the app. Walking through it:

- `setLang` is defined *inside* here. It's the only function anywhere in the app that's allowed to change the language, and it does three things in order: check the requested language is actually one of the two we support; save it to `localStorage` (so it survives a refresh); then, and only then, actually flip the in-memory state.
- The returned object has four properties: `lang` (the raw code), `dir` (the calculated direction), `setLang` (the one door for changing the language), and `t` — a small function that, when called, always passes the *current* `lang` into `translate()`. This is why a component using `t('expenses.title')` never has to mention which language it's in — the answer was already baked into `t` when it was created.

`useMemo` wraps all of this so that this object is only rebuilt when `lang` or `dir` actually change — not on every single re-render for unrelated reasons. Without it, every component listening to this context would be told "something changed!" constantly, even when the language hadn't moved at all, causing unnecessary re-renders across the whole app.

**`return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>`**
This is the actual broadcast. `LanguageContext.Provider` is a special React component — anything rendered inside it (`{children}`, which in this app's case is the *entire rest of the application*) can read `value` by calling `useTranslation()`, no matter how deeply nested it is.

### What imports this file

`src/main.jsx` — the only place `LanguageProvider` is ever used.

### What this file imports

`LanguageContext` from `./useTranslation`, and `STORAGE_KEY`, `LANGUAGES`, `readStoredLang`, `titles`, `translate` from `./translate`.

### What data enters this file

Whatever is in `localStorage` under `'lang'` when the app first boots (read once, via `readStoredLang`). After that, calls to `setLang(newLanguage)` coming from `LanguageSwitcher`.

### What data leaves this file

The broadcast object `{ lang, dir, setLang, t }`, available to every component in the app via `useTranslation()`. It also writes directly to the `<html>` tag's `lang` and `dir` attributes, the document title, and to `localStorage`.

---

## `src/i18n/en/index.js` and `src/i18n/ar/index.js`

### Purpose, in simple language

Each of these gathers up all the smaller word-list files in its folder (`common.js`, `navigation.js`, etc.) into one single object — the complete word library for that language.

### Complete current source code

**`src/i18n/en/index.js`**
```js
import common from './common'
import navigation from './navigation'
import enums from './enums'
import auditLog from './auditLog'
import dashboard from './dashboard'
import expenses from './expenses'

// Add a namespace here as each feature is migrated off hardcoded strings.
export default {
    common,
    navigation,
    enums,
    auditLog,
    dashboard,
    expenses,
}
```

**`src/i18n/ar/index.js`**
```js
import common from './common'
import navigation from './navigation'
import enums from './enums'
import auditLog from './auditLog'
import dashboard from './dashboard'
import expenses from './expenses'

// Add a namespace here as each feature is migrated off hardcoded strings.
export default {
    common,
    navigation,
    enums,
    auditLog,
    dashboard,
    expenses,
}
```

### Explained group by group

Both files are structurally identical — that's not a coincidence, it's a requirement. Each imports six smaller files (`common`, `navigation`, `enums`, `auditLog`, `dashboard`, `expenses`) and combines them into one object using the shorthand `{ common, navigation, ... }`, which is the same as writing `{ common: common, navigation: navigation, ... }`.

The result is one big nested object per language:
```js
en = {
    common:     { save: 'Save', cancel: 'Cancel', ... },
    navigation: { dashboard: 'Dashboard', ... },
    enums:      { role: {...}, expenseCategory: {...} },
    auditLog:   { title: 'Activity', ... },
    dashboard:  { stats: {...}, ai: {...} },
    expenses:   { title: 'Expenses', ... },
}
```

This is exactly the object that `bundles.en` and `bundles.ar` point to inside `translate.js`.

### What imports these files

`src/i18n/translate.js` imports both (`import en from './en'` and `import ar from './ar'`).

### What these files import

The six namespace files listed above, from their own folder.

### What data enters/leaves

No dynamic data — these are pure, static assembly files. What "leaves" is the assembled object, handed to `translate.js`.

---

## The namespace files — `common`, `navigation`, `enums`, `auditLog`, `dashboard`, `expenses`

### Purpose, in simple language

These fourteen files (seven per language) are where the actual words live. Each one is a plain JavaScript object mapping a short key name to a piece of display text. English and Arabic versions of the same namespace always have **identical key names** — only the text values differ. This matching-keys rule is what lets a component ask for `t('expenses.title')` without ever needing to know which language is currently active.

Below, each namespace is shown with its English and Arabic versions side by side, since understanding one namespace fully teaches you how to read all fourteen.

---

### `common` — words shared across more than one page

**`src/i18n/en/common.js`**
```js
// Shared UI vocabulary. Anything used by more than one feature lives here —
// never duplicate a string into a feature namespace.

export default {
    // Buttons / actions
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    close: 'Close',
    clearFilters: 'Clear filters',

    // Filters
    to: 'to',
    allStores: 'All stores',

    // Table / list states
    actions: 'Actions',
    date: 'Date',
    time: 'Time',
    store: 'Store',
    amount: 'Amount',
    total: 'Total',
    remaining: 'Remaining',
    status: 'Status',
    customer: 'Customer',
    createdBy: 'Created by',
    description: 'Description',
    notes: 'Notes',
    optional: 'optional',
    all: 'All',
    viewAll: 'View all',
    quantity: 'Quantity',
    product: 'Product',
    warehouse: 'Warehouse',

    // Pagination
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {page} of {total}',

    // Formatting
    currency: 'EGP',
}
```

**`src/i18n/ar/common.js`**
```js
// المفردات المشتركة في الواجهة. أي نص يُستخدم في أكثر من شاشة يعيش هنا —
// ممنوع تكرار نفس النص داخل ملف خاص بميزة معينة.

export default {
    // الأزرار والإجراءات — مصادر، مش أفعال أمر
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    add: 'إضافة',
    close: 'إغلاق',
    clearFilters: 'مسح الفلاتر',

    // الفلاتر
    to: 'إلى',
    allStores: 'كل المتاجر',

    // الجداول والقوائم
    actions: 'إجراءات',
    date: 'التاريخ',
    time: 'الوقت',
    store: 'المتجر',
    amount: 'المبلغ',
    total: 'الإجمالي',
    remaining: 'المتبقي',
    status: 'الحالة',
    customer: 'العميل',
    createdBy: 'بواسطة',
    description: 'الوصف',
    notes: 'ملاحظات',
    optional: 'اختياري',
    all: 'الكل',
    viewAll: 'عرض الكل',
    quantity: 'الكمية',
    product: 'المنتج',
    warehouse: 'المخزن',

    // ترقيم الصفحات
    previous: 'السابق',
    next: 'التالي',
    pageOf: 'صفحة {page} من {total}',

    // التنسيق
    currency: 'ج.م',
}
```

**Explained by group**

- **Buttons/actions group** (`save`, `cancel`, `edit`, `delete`, `add`, `close`, `clearFilters`) — short, reusable action words that appear on multiple pages (a save button exists on many forms, not just one).
- **Filters group** (`to`, `allStores`) — words used specifically inside filter bars, like the "to" between two date pickers.
- **Table/list states group** — column headers and states that many different tables share (`date`, `amount`, `status`, and so on), so a page listing orders and a page listing expenses can both reuse `common.date` instead of each defining their own.
- **Pagination group** — notice `pageOf: 'Page {page} of {total}'`. The curly braces are placeholders — this is the exact string `interpolate()` from `translate.js` fills in.
- **Formatting group** — just one entry, `currency`, which holds the currency symbol/code (`'EGP'` in English, `'ج.م'` in Arabic). This is read by `src/lib/format.js`, not typed directly into components.

Every key in `en/common.js` has a matching key in `ar/common.js`, in the same order (not required, but kept consistent for readability), proving the "matching shelves, different books" idea from the rest of this document.

---

### `navigation` — the sidebar

**`src/i18n/en/navigation.js`**
```js
export default {
    groups: {
        operations: 'Operations',
        finance: 'Finance',
        suppliers: 'Suppliers',
        system: 'System',
    },

    dashboard: 'Dashboard',
    orders: 'Orders',
    customers: 'Customers',
    products: 'Products',
    inventory: 'Inventory',
    expenses: 'Expenses',
    purchaseOrders: 'Purchases',
    reports: 'Reports',
    suppliers: 'Suppliers',
    auditLog: 'Activity',
    settings: 'Settings',

    logout: 'Log out',
    openMenu: 'Open menu',
    switchToEnglish: 'Switch to English',
    switchToArabic: 'Switch to Arabic',
}
```

**`src/i18n/ar/navigation.js`**
```js
export default {
    groups: {
        operations: 'العمليات',
        finance: 'المالية',
        suppliers: 'الموردين',
        system: 'النظام',
    },

    dashboard: 'لوحة التحكم',
    orders: 'الطلبات',
    customers: 'العملاء',
    products: 'المنتجات',
    inventory: 'المخزون',
    expenses: 'المصروفات',
    purchaseOrders: 'المشتريات',
    reports: 'التقارير',
    suppliers: 'الموردين',
    auditLog: 'النشاط',
    settings: 'الإعدادات',

    logout: 'تسجيل الخروج',
    openMenu: 'فتح القائمة',
    switchToEnglish: 'التبديل للإنجليزية',
    switchToArabic: 'التبديل للعربية',
}
```

**Explained by group**

- **`groups`** is a *nested object*, not a flat key. This is because the sidebar has section headers ("Operations", "Finance") above groups of links, so those four group titles are kept under their own `groups.*` sub-object rather than mixed in at the top level with individual link labels. To read one, a component would call `t('navigation.groups.finance')`.
- **The flat link labels** (`dashboard`, `orders`, `customers`, ...) are each one sidebar link's text.
- **`logout`, `openMenu`** — small UI text: the logout button, and the `aria-label` on the mobile hamburger menu button (used by screen readers).
- **`switchToEnglish`, `switchToArabic`** — these are used only as the invisible `aria-label` text on the `LanguageSwitcher` buttons (explained below) — never as visible text, since the switcher's visible labels are deliberately hardcoded, not translated.

---

### `enums` — labels for values the backend sends

**`src/i18n/en/enums.js`**
```js
// Display labels for backend enum values. The KEYS are the raw values the API
// sends and are part of the API contract — never translate or rename a key,
// only the string a user sees.

export default {
    role: {
        tenant_admin: 'Store Owner',
        store_manager: 'Store Manager',
        store_staff: 'Staff',
    },

    paymentMethod: {
        cash: 'Cash',
        bank_transfer: 'Bank Transfer',
        instapay: 'InstaPay',
        vodafone_cash: 'Vodafone Cash',
        orange_cash: 'Orange Cash',
        check: 'Cheque',
    },

    // Which reference field to ask for, per payment method.
    paymentReference: {
        bank_transfer: 'Transfer Number',
        instapay: 'Transaction Number',
        vodafone_cash: 'Sender Number',
        orange_cash: 'Sender Number',
        check: 'Cheque Number',
    },

    orderStatus: {
        paid: 'Paid',
        unpaid: 'Unpaid',
    },

    // Audit-log `type` is a union across three sources (ledger / inventory /
    // audit), so these keys mirror typeStyles in lib/auditLog.js exactly.
    auditType: {
        ORDER_CHARGE: 'Order Charge',
        PAYMENT: 'Payment',
        REVERSAL: 'Reversal',
        CREDIT_APPLY: 'Credit Added',
        CREDIT_CONSUMED: 'Credit Used',
        REFUND: 'Refund',
        PURCHASE_CHARGE: 'Purchase Charge',
        PURCHASE_REVERSAL: 'Purchase Reversal',
        SUPPLIER_PAYMENT: 'Supplier Payment',
        SUPPLIER_PAYMENT_REVERSAL: 'Supplier Payment Reversal',
        SALE: 'Sale',
        RETURN: 'Stock Return',
        TRANSFER_IN: 'Transfer In',
        TRANSFER_OUT: 'Transfer Out',
        ADJUSTMENT_IN: 'Adjustment In',
        ADJUSTMENT_OUT: 'Adjustment Out',
        PURCHASE_IN: 'Purchase In',
        PURCHASE_OUT: 'Purchase Out',
        created: 'Created',
        updated: 'Updated',
        deleted: 'Deleted',
    },

    // The API sends class_basename(), so these are short model names.
    auditEntity: {
        Product: 'Product',
        Customer: 'Customer',
        Supplier: 'Supplier',
        Store: 'Store',
        Order: 'Order',
        PurchaseOrder: 'Purchase Order',
        Expense: 'Expense',
    },

    // Keys match Expense::CATEGORIES on the backend exactly.
    expenseCategory: {
        SALARIES: 'Salaries',
        RENT: 'Rent',
        UTILITIES: 'Utilities',
        TRANSPORTATION: 'Transportation',
        INTERNET: 'Internet',
        MAINTENANCE: 'Maintenance',
        SUPPLIES: 'Supplies',
        MISCELLANEOUS: 'Miscellaneous',
    },
}
```

**`src/i18n/ar/enums.js`**
```js
// أسماء العرض لقيم الـ enums القادمة من الباك إند. المفاتيح هي القيم الخام
// اللي بيبعتها الـ API وجزء من عقد الـ API — ممنوع ترجمة أو تغيير أي مفتاح،
// النص المعروض للمستخدم بس هو اللي بيتترجم.

export default {
    role: {
        tenant_admin: 'صاحب المتجر',
        store_manager: 'مدير المتجر',
        store_staff: 'موظف',
    },

    paymentMethod: {
        cash: 'نقدي',
        bank_transfer: 'تحويل بنكي',
        instapay: 'إنستاباي',
        vodafone_cash: 'فودافون كاش',
        orange_cash: 'أورنج كاش',
        check: 'شيك',
    },

    // بيان رقم المرجع المطلوب حسب طريقة الدفع.
    paymentReference: {
        bank_transfer: 'رقم الحوالة',
        instapay: 'رقم العملية',
        vodafone_cash: 'رقم المُرسِل',
        orange_cash: 'رقم المُرسِل',
        check: 'رقم الشيك',
    },

    orderStatus: {
        paid: 'مدفوع',
        unpaid: 'غير مدفوع',
    },

    // نوع سجل النشاط بيجمع تلات مصادر (فلوس / مخزون / تعديلات)، فالمفاتيح
    // مطابقة لـ typeStyles في lib/auditLog.js بالظبط.
    auditType: {
        ORDER_CHARGE: 'قيد طلب',
        PAYMENT: 'دفعة',
        REVERSAL: 'عكس قيد',
        CREDIT_APPLY: 'إضافة رصيد',
        CREDIT_CONSUMED: 'استخدام رصيد',
        REFUND: 'مرتجع',
        PURCHASE_CHARGE: 'قيد شراء',
        PURCHASE_REVERSAL: 'عكس قيد شراء',
        SUPPLIER_PAYMENT: 'دفعة لمورد',
        SUPPLIER_PAYMENT_REVERSAL: 'عكس دفعة مورد',
        SALE: 'بيع',
        RETURN: 'مرتجع مخزون',
        TRANSFER_IN: 'تحويل وارد',
        TRANSFER_OUT: 'تحويل صادر',
        ADJUSTMENT_IN: 'تسوية إضافة',
        ADJUSTMENT_OUT: 'تسوية خصم',
        PURCHASE_IN: 'وارد مشتريات',
        PURCHASE_OUT: 'صادر مشتريات',
        created: 'إنشاء',
        updated: 'تعديل',
        deleted: 'حذف',
    },

    // الـ API بيبعت class_basename()، يعني أسماء موديلات مختصرة.
    auditEntity: {
        Product: 'منتج',
        Customer: 'عميل',
        Supplier: 'مورد',
        Store: 'متجر',
        Order: 'طلب',
        PurchaseOrder: 'أمر شراء',
        Expense: 'مصروف',
    },

    // المفاتيح مطابقة لـ Expense::CATEGORIES في الباك إند بالظبط.
    expenseCategory: {
        SALARIES: 'رواتب',
        RENT: 'إيجار',
        UTILITIES: 'مرافق',
        TRANSPORTATION: 'مواصلات',
        INTERNET: 'إنترنت',
        MAINTENANCE: 'صيانة',
        SUPPLIES: 'مستلزمات',
        MISCELLANEOUS: 'متنوعات',
    },
}
```

**Explained by group — this is the most important namespace to understand carefully**

This file is different from every other namespace in one crucial way: **the keys are not made up by this project — they are copied exactly from what the Laravel backend sends.** Look at `expenseCategory.SALARIES`. That's not a stylistic choice to use capital letters — `"SALARIES"` is the literal string the backend's `Expense::CATEGORIES` list contains, and the literal string this app must send back when saving an expense. Renaming that key to `salaries` or translating it would break saving expenses entirely, because the backend wouldn't recognize the new value.

Each sub-object here (`role`, `paymentMethod`, `paymentReference`, `orderStatus`, `auditType`, `auditEntity`, `expenseCategory`) matches one specific field the backend sends. A component reads one of these with a *computed* key, built from real data:
```js
t(`enums.expenseCategory.${expense.category}`)
```
If `expense.category` is `"SALARIES"`, this becomes `t('enums.expenseCategory.SALARIES')`, which resolves to `"Salaries"` or `"رواتب"` depending on the active language.

---

### `dashboard` — text used only on the Dashboard page

**`src/i18n/en/dashboard.js`**
```js
export default {
    greetingWithName: 'Good day, {name}',
    intro: 'Welcome back! Here is a quick look at how your store is doing today.',

    // Used by the greeting helpers, currently disabled in the JSX.
    greetings: {
        friday: 'Have a blessed Friday,',
        lateNight: 'Still up?',
        earlyMorning: 'Good morning,',
        morning: 'Good morning,',
        midday: 'Good day,',
        evening: 'Good evening,',
        night: 'Good evening,',
    },

    sub: {
        greatRevenue: '🔥 Great day so far! You have made {amount} in sales.',
        unpaidOrders: '⚠️ You have {count} unpaid orders that need following up.',
        lowStock: '📦 {count} products are running low and need restocking.',
        noOrders: '🚀 No orders logged yet today — here is to a good one.',
        default: 'Here is a summary of activity at {business} today.',
    },

    periods: {
        Today: 'Today',
        Week: 'Week',
        Month: 'Month',
        Year: 'Year',
    },

    sections: {
        today: 'Today',
        overview: 'Overview',
        quickActions: 'Quick actions',
        aiInsights: 'Smart insights',
    },

    stats: {
        revenue: 'Revenue collected',
        payments: 'Payments: {count}',
        noSalesYet: 'No sales yet',
        newOrders: 'New orders',
        sales: 'Sales: {amount}',
        noOrdersYet: 'No orders yet',
        unpaidOrders: 'Unpaid orders',
        needsFollowUp: 'Needs following up',
        allSettled: 'All settled ✓',
        totalOwed: 'Total owed',
        acrossAllCustomers: 'Across all customers',
        noDues: 'Nothing outstanding 🎉',
        totalCustomers: 'Total customers',
        addFirstCustomer: 'Add your first customer',
        totalProducts: 'Total products',
        addFirstProduct: 'Add your first product',
        lowStockAlert: 'Low stock alerts',
        tapToReview: 'Tap to review',
        stockHealthy: 'Stock looks good ✓',
    },

    actions: {
        newOrder: 'New order',
        addCustomer: 'Add customer',
        addProduct: 'Add product',
        viewReports: 'View reports',
        quickSale: 'Quick sale',
    },

    ai: {
        last30Days: 'Last 30 days',
        updated: '✓ Up to date',
        analyzing: 'Analyzing…',
        refresh: '🔄 Refresh',
        analyzeSales: '✨ Analyze sales',
        emptyTitle: 'Smart analysis of your sales',
        emptyBody: 'Tap "Analyze sales" for insights tailored to your store.',
        analyzeNow: '✨ Analyze sales now',
        loading: 'Analyzing sales data…',
        loadingHint: 'This may take a few seconds.',
        noData: 'Not enough data yet',
        footer: 'Analyzed by AI',
        refreshAnalysis: '🔄 Refresh analysis',
        cards: {
            opportunity: 'Opportunity',
            urgent: 'Urgent',
            trend: 'Trend',
        },
    },

    recentOrders: {
        title: 'Recent orders',
        subtitle: 'Orders: {count} · today and newer',
        empty: 'No orders yet',
        createFirst: 'Create your first order',
        columns: {
            invoice: 'Invoice',
            items: 'Items',
        },
    },

    panel: {
        topDebtors: 'Largest balances',
        lowStock: 'Products running low',
        unpaidOrdersCount: 'Unpaid orders: {count}',
        left: '{count} left',
        threshold: 'Threshold: {count}',
        allGood: 'All clear!',
        allGoodSub: 'No outstanding balances and no low stock.',
    },

    loadFailed: 'Something went wrong loading the dashboard.',
}
```

**`src/i18n/ar/dashboard.js`**
```js
export default {
    greetingWithName: 'نهارك سعيد، {name}',
    intro: 'أهلاً بيك من تاني! دي نظرة سريعة على أداء متجرك والتحليلات بتاعة النهاردة.',

    // بتستخدمها دوال التحية، المعطلة حالياً في الـ JSX.
    greetings: {
        friday: 'جمعة مباركة،',
        lateNight: 'سهران لسه؟',
        earlyMorning: 'صباح الفل،',
        morning: 'صباح الخير،',
        midday: 'نهارك سعيد،',
        evening: 'مساء الخير،',
        night: 'مساء النور،',
    },

    sub: {
        greatRevenue: '🔥 أداء رائع اليوم! حققت مبيعات بقيمة {amount} حتى الآن',
        unpaidOrders: '⚠️ لديك {count} طلبات غير مسددة تحتاج إلى المتابعة',
        lowStock: '📦 يوجد {count} منتجات أوشكت على النفاد وتحتاج إلى إعادة التوريد',
        noOrders: '🚀 لم يتم تسجيل أي طلبات اليوم بعد، نتمنى لك يوماً ناجحاً',
        default: 'إليك ملخص نشاط {business} اليوم',
    },

    // المفاتيح هي قيم الفلتر الداخلية — متتترجمش.
    periods: {
        Today: 'اليوم',
        Week: 'الأسبوع',
        Month: 'الشهر',
        Year: 'السنة',
    },

    sections: {
        today: 'اليوم',
        overview: 'نظرة عامة',
        quickActions: 'إجراءات سريعة',
        aiInsights: 'تحليلات ذكية',
    },

    stats: {
        revenue: 'الإيرادات المحصلة',
        payments: 'الدفعات: {count}',
        noSalesYet: 'مفيش مبيعات لحد دلوقتي',
        newOrders: 'الطلبات الجديدة',
        sales: 'المبيعات: {amount}',
        noOrdersYet: 'مفيش طلبات لحد دلوقتي',
        unpaidOrders: 'الطلبات غير المدفوعة',
        needsFollowUp: 'محتاجة متابعة',
        allSettled: 'كله متسدد ✓',
        totalOwed: 'إجمالي المستحقات',
        acrossAllCustomers: 'على كل العملاء',
        noDues: 'مفيش مستحقات 🎉',
        totalCustomers: 'إجمالي العملاء',
        addFirstCustomer: 'أضف أول عميل',
        totalProducts: 'إجمالي المنتجات',
        addFirstProduct: 'أضف أول منتج',
        lowStockAlert: 'تنبيه نقص المخزون',
        tapToReview: 'اضغط للمراجعة',
        stockHealthy: 'المخزون كويس ✓',
    },

    actions: {
        newOrder: 'طلب جديد',
        addCustomer: 'إضافة عميل',
        addProduct: 'إضافة منتج',
        viewReports: 'عرض التقارير',
        quickSale: 'بيع سريع',
    },

    ai: {
        last30Days: 'آخر 30 يوم',
        updated: '✓ محدّث',
        analyzing: 'جاري التحليل...',
        refresh: '🔄 تحديث',
        analyzeSales: '✨ تحليل المبيعات',
        emptyTitle: 'تحليل ذكي لمبيعاتك',
        emptyBody: 'اضغط على "تحليل المبيعات" للحصول على رؤى مخصصة لمتجرك',
        analyzeNow: '✨ تحليل المبيعات الآن',
        loading: 'جاري تحليل بيانات المبيعات...',
        loadingHint: 'قد يستغرق هذا بضع ثوانٍ',
        noData: 'لا توجد بيانات كافية',
        footer: 'تم التحليل بواسطة الذكاء الاصطناعي',
        refreshAnalysis: '🔄 تحديث التحليل',
        cards: {
            opportunity: 'فرصة',
            urgent: 'عاجل',
            trend: 'اتجاه',
        },
    },

    recentOrders: {
        title: 'أحدث الطلبات',
        subtitle: 'الطلبات: {count} · النهاردة والأحدث',
        empty: 'مفيش طلبات لسه',
        createFirst: 'اعمل أول طلب',
        columns: {
            invoice: 'الفاتورة',
            items: 'الأصناف',
        },
    },

    panel: {
        topDebtors: 'أكبر المديونيات',
        lowStock: 'منتجات قربت تخلص',
        unpaidOrdersCount: 'طلبات غير مدفوعة: {count}',
        left: 'متبقي {count}',
        threshold: 'الحد الأدنى: {count}',
        allGood: 'كله تمام!',
        allGoodSub: 'مفيش مديونيات ولا نقص مخزون',
    },

    loadFailed: 'حصلت مشكلة في تحميل لوحة التحكم',
}
```

**Explained by group**

This is the deepest-nested namespace in the project, which makes it the best one for understanding multi-level dot-paths. Notice:

- `ai.cards.opportunity` is **three levels deep**: the top-level `ai` object contains a `cards` object, which contains `opportunity`. To read it: `t('dashboard.ai.cards.opportunity')`.
- `greetings` and `sub` hold text for a greeting feature that is currently **written but switched off** in `Dashboard.jsx` (the code that would call it is commented out). This is intentional — the translations exist and are ready, but the feature itself isn't live yet.
- `periods.Today`, `periods.Week`, etc. — notice these keys are capitalized (`Today`, not `today`). That's because they match the exact string values used internally by the Dashboard's period-switcher state (`activePeriod === 'Today'`), the same "key must match real data" pattern seen in `enums`.
- Several entries contain `{amount}`, `{count}`, or `{business}` placeholders, filled in via `interpolate()` exactly as described in the `translate.js` section above.

---

### `expenses` — text used only on the Expenses page and its modal

**`src/i18n/en/expenses.js`**
```js
export default {
    title: 'Expenses',
    addExpense: 'Add Expense',
    editExpense: 'Edit Expense',
    newExpense: 'New Expense',
    deleteExpense: 'Delete Expense',
    totalExpenses: 'Total Expenses',

    category: 'Category',
    allCategories: 'All categories',
    chooseCategory: 'Choose a category',

    amountWithCurrency: 'Amount (EGP)',
    generalExpense: 'General expense across all stores',
    notesPlaceholder: 'Extra details about this expense…',

    empty: 'No expenses recorded yet. Add your first expense.',
    emptyFiltered: 'No expenses match these filters.',

    loadFailed: 'Something went wrong loading expenses.',
    loadFailedRetry: 'Something went wrong loading expenses. Please try again.',
    deleted: 'Expense deleted successfully.',
    deleteFailed: 'Something went wrong deleting the expense.',
    created: 'Expense added successfully.',
    updated: 'Expense updated successfully.',
    saveFailed: 'Something went wrong saving the expense.',

    categoryRequired: 'Please choose an expense category.',
    amountInvalid: 'Please enter a valid amount.',
    descriptionRequired: 'Miscellaneous expenses must have a description.',
}
```

**`src/i18n/ar/expenses.js`**
```js
export default {
    title: 'المصروفات',
    addExpense: 'إضافة مصروف',
    editExpense: 'تعديل المصروف',
    newExpense: 'إضافة مصروف جديد',
    deleteExpense: 'حذف المصروف',
    totalExpenses: 'إجمالي المصروفات',

    category: 'التصنيف',
    allCategories: 'كل التصنيفات',
    chooseCategory: 'اختار تصنيف',

    amountWithCurrency: 'المبلغ (ج.م)',
    generalExpense: 'مصروف عام على كل المتاجر',
    notesPlaceholder: 'تفاصيل إضافية عن المصروف...',

    empty: 'مفيش مصروفات مسجلة لسه. أضف أول مصروف.',
    emptyFiltered: 'مفيش مصروفات مطابقة للفلاتر دي.',

    loadFailed: 'حصلت مشكلة في تحميل المصروفات',
    loadFailedRetry: 'حصلت مشكلة في تحميل المصروفات. جرب تاني.',
    deleted: 'تم حذف المصروف بنجاح.',
    deleteFailed: 'حصلت مشكلة في حذف المصروف',
    created: 'تم إضافة المصروف بنجاح.',
    updated: 'تم تعديل المصروف بنجاح.',
    saveFailed: 'حصلت مشكلة في حفظ المصروف',

    categoryRequired: 'اختار تصنيف المصروف',
    amountInvalid: 'اكتب مبلغ صحيح',
    descriptionRequired: 'المصروفات المتنوعة لازم يكون ليها وصف',
}
```

**Explained by group**

- **Titles group** (`title`, `addExpense`, `editExpense`, `newExpense`, `deleteExpense`, `totalExpenses`) — headings and button labels seen on the page and inside the modal.
- **Form field group** (`category`, `allCategories`, `chooseCategory`, `amountWithCurrency`, `generalExpense`, `notesPlaceholder`) — labels and placeholder text for the create/edit form.
- **Empty-state group** (`empty`, `emptyFiltered`) — what shows when there are no expenses to display, with two different messages depending on whether filters are active.
- **Toast message group** (`loadFailed` through `saveFailed`) — every success/error message shown via `showToast(...)` after an API call.
- **Validation group** (`categoryRequired`, `amountInvalid`, `descriptionRequired`) — form validation messages, shown before the API is even called.

This is a flat namespace — no nested sub-objects, unlike `dashboard` or `enums`. This matters later in this document (see the Translation Lookup Journey section), because it means a path like `expenses.form.amount` does **not** exist in this project — there is no `form` sub-object inside `expenses`.

---

### `auditLog` — text used only on the Activity Log page and its detail drawer

**`src/i18n/en/auditLog.js`**
```js
export default {
    title: 'Activity',
    empty: 'No activity yet.',
    loadFailed: 'Something went wrong loading the activity log.',

    sources: {
        all: 'All',
        ledger: 'Money',
        inventory: 'Stock',
        audit: 'Edits',
    },

    days: {
        today: 'Today',
        yesterday: 'Yesterday',
    },

    detail: {
        fallbackTitle: 'Activity',
        systemUser: 'System',
        noDescription: 'No description.',
        field: 'Field',
        oldValue: 'Previous value',
        newValue: 'New value',
        batchSummary: 'Products: {products} — total quantity: {quantity}',
        loading: 'Loading…',
    },
}
```

**`src/i18n/ar/auditLog.js`**
```js
export default {
    title: 'النشاط',
    empty: 'مفيش نشاط.',
    loadFailed: 'حصلت مشكلة في تحميل النشاط',

    sources: {
        all: 'الكل',
        ledger: 'فلوس',
        inventory: 'مخزون',
        audit: 'تعديلات',
    },

    days: {
        today: 'النهاردة',
        yesterday: 'إمبارح',
    },

    detail: {
        fallbackTitle: 'نشاط',
        systemUser: 'النظام',
        noDescription: 'لا يوجد وصف.',
        field: 'الحقل',
        oldValue: 'القيمة السابقة',
        newValue: 'القيمة الجديدة',
        batchSummary: 'Products: {products} — إجمالي الكمية: {quantity}',
        loading: 'جاري التحميل...',
    },
}
```

**Explained by group**

- **`sources`** — the four filter-pill options at the top of the Activity page (All / Money / Stock / Edits). Note the keys `all`, `ledger`, `inventory`, `audit` match the internal filter values used in the code, not arbitrary names.
- **`days`** — used by the date-grouping logic in `src/lib/auditLog.js` to label "today" and "yesterday" groups of activity, in place of a literal date, before falling back to an actual formatted date for anything older.
- **`detail`** — everything inside the slide-out drawer that shows one activity entry's full details, including the `batchSummary` placeholder string used when one action affected multiple products at once.

---

## `src/components/LanguageSwitcher.jsx`

### Purpose, in simple language

This is the actual clickable button pair the user interacts with to change languages. It is the only component in the entire app that ever calls `setLang(...)`.

### Complete current source code

```jsx
import { useTranslation } from '../i18n/useTranslation'

// Each option is always written in its own language, so the control stays
// readable whichever language is active. This is the one place we deliberately
// don't run the visible label through t().
const options = [
    { lang: 'en', label: 'EN', ariaKey: 'navigation.switchToEnglish' },
    { lang: 'ar', label: 'العربية', ariaKey: 'navigation.switchToArabic' },
]

export default function LanguageSwitcher() {
    const { lang, setLang, t } = useTranslation()

    return (
        <div className="flex gap-1 p-0.5 bg-gray-800 rounded-md mb-2">
            {options.map(option => (
                <button
                    key={option.lang}
                    type="button"
                    onClick={() => setLang(option.lang)}
                    aria-label={t(option.ariaKey)}
                    aria-pressed={lang === option.lang}
                    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                        lang === option.lang
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
```

### Explained group by group

**The `options` array**
```js
const options = [
    { lang: 'en', label: 'EN', ariaKey: 'navigation.switchToEnglish' },
    { lang: 'ar', label: 'العربية', ariaKey: 'navigation.switchToArabic' },
]
```
A list of two plain objects describing the two buttons to render. Notice `label` is a hardcoded literal — `'EN'` and `'العربية'` — **not** wrapped in `t(...)`. This is intentional: if the labels were translated, then when the app was stuck in one language, the button meant to switch away might display in that same unreadable language, making it impossible to find. Writing each option in its own language guarantees both are always readable, no matter which language is currently active.

**`const { lang, setLang, t } = useTranslation()`**
This is the "tuning in" moment — pulling three things out of the broadcast object described in the `index.jsx` section: the currently active language, the function to change it, and the translation function (used only for the invisible `aria-label`, not the visible text).

**The `.map(...)` over `options`**
For each of the two options, it renders one `<button>`. The important line is:
```jsx
onClick={() => setLang(option.lang)}
```
Clicking the "EN" button calls `setLang('en')`. Clicking "العربية" calls `setLang('ar')`. This is the literal starting point of everything described later in the Language Switch Journey section.

**`aria-label={t(option.ariaKey)}`**
Unlike the visible `label`, the `aria-label` — invisible text read aloud by screen readers — *is* translated, because a screen reader user already has their assistive technology set to a language, so translating this text is the more accessible choice.

**`aria-pressed={lang === option.lang}`**
Tells assistive technology whether this particular button represents the currently active state — `true` for whichever button matches the current `lang`.

**The `className` ternary**
```js
lang === option.lang
    ? 'bg-blue-600 text-white'
    : 'text-gray-400 hover:text-white hover:bg-gray-700'
```
Purely visual — highlights whichever button matches the current language in blue, and leaves the other one gray.

### What imports this file

`src/components/Sidebar.jsx` — specifically inside the `UserFooter` component, so it renders in both the desktop sidebar and the mobile drawer.

### What this file imports

`useTranslation` from `../i18n/useTranslation`.

### What data enters this file

The current `lang`, and the `setLang`/`t` functions, all via `useTranslation()`.

### What data leaves this file

A call to `setLang(newLanguageCode)` whenever the user clicks a button — the trigger for the entire language-switching process.

---

## `src/components/Sidebar.jsx`

### Purpose, in simple language

The app's main navigation menu. It's documented here because it's the component that mounts `LanguageSwitcher` and is one of the more complete real-world examples of a fully migrated, bilingual component — using translated labels, a translated role name, and a direction-aware mobile drawer, all at once.

### Complete current source code

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import LanguageSwitcher from './LanguageSwitcher'
import {
    Menu,
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    Warehouse,
    Wallet,
    ShoppingBag,
    BarChart3,
    Building2,
    History,
    Settings,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet'

const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
    }`

function NavGroup({ title, items, onNavigate }) {
    if (!items.length) return null

    return (
        <div className="mb-6">
            {title && (
                <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {title}
                </p>
            )}
            <div className="flex flex-col gap-1">
                {items.map(item => (
                    <NavLink key={item.to} to={item.to} onClick={onNavigate} className={navLinkClass}>
                        <item.icon size={18} strokeWidth={1.75} className="shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    )
}

function Brand() {
    return (
        <span className="text-xl font-bold text-white">
            Multi<span className="text-blue-400">Dukkan</span>
        </span>
    )
}

function UserFooter({ user, onLogout }) {
    const { t } = useTranslation()
    const roleLabel = user.role ? t(`enums.role.${user.role}`) : ''

    return (
        <div className="border-t border-gray-800 p-4 shrink-0">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.business_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                        {user.name} · <span className="text-blue-400">{roleLabel}</span>
                    </p>
                </div>
            </div>
            <LanguageSwitcher />
            <button
                onClick={onLogout}
                className="w-full px-3 py-1.5 text-sm bg-gray-700 hover:bg-red-600 rounded-md transition-colors text-white"
            >
                {t('navigation.logout')}
            </button>
        </div>
    )
}

export default function Sidebar() {
    const navigate = useNavigate()
    const { t, dir } = useTranslation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const handleLogout = async () => {
        try {
            await api.post('/logout')
        } catch (err) {}
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    const canSeeExpenses = user.role === 'tenant_admin' || user.role === 'store_manager'
    const canSeeReports = user.role === 'tenant_admin'
    const canSeeAuditLog = user.role === 'tenant_admin'
    const canSeeSettings = user.role === 'tenant_admin' || user.role === 'store_manager'

    const groups = [
        { title: null, items: [
            { to: '/dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
        ] },
        { title: t('navigation.groups.operations'), items: [
            { to: '/orders', label: t('navigation.orders'), icon: ShoppingCart },
            { to: '/customers', label: t('navigation.customers'), icon: Users },
            { to: '/products', label: t('navigation.products'), icon: Package },
            { to: '/inventory', label: t('navigation.inventory'), icon: Warehouse },
        ] },
        { title: t('navigation.groups.finance'), items: [
            ...(canSeeExpenses ? [{ to: '/expenses', label: t('navigation.expenses'), icon: Wallet }] : []),
            { to: '/purchase-orders', label: t('navigation.purchaseOrders'), icon: ShoppingBag },
            ...(canSeeReports ? [{ to: '/reports', label: t('navigation.reports'), icon: BarChart3 }] : []),
        ] },
        { title: t('navigation.groups.suppliers'), items: [
            { to: '/suppliers', label: t('navigation.suppliers'), icon: Building2 },
        ] },
        { title: t('navigation.groups.system'), items: [
            ...(canSeeAuditLog ? [{ to: '/audit-log', label: t('navigation.auditLog'), icon: History }] : []),
            ...(canSeeSettings ? [{ to: '/settings', label: t('navigation.settings'), icon: Settings }] : []),
        ] },
    ]

    return (
        <>
            {/* Desktop sidebar — fixed full height, hidden below lg */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:start-0 lg:w-64 bg-gray-900 border-e border-gray-800 z-30">
                <div className="h-16 flex items-center px-4 border-b border-gray-800 shrink-0">
                    <Brand />
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    {groups.map((group, i) => (
                        <NavGroup key={i} title={group.title} items={group.items} />
                    ))}
                </nav>
                <UserFooter user={user} onLogout={handleLogout} />
            </aside>

            {/* Mobile top bar — sticky, in normal flow, hidden at lg and up */}
            <div className="lg:hidden sticky top-0 z-40 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-3 h-14 px-4">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="text-white p-2 -ms-2"
                        aria-label={t('navigation.openMenu')}
                    >
                        <Menu size={22} />
                    </button>
                    <Brand />
                </div>
            </div>

            {/* Mobile off-canvas nav drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="bg-gray-900 border-gray-800 text-white p-0 w-72 flex flex-col gap-0">
                    <SheetHeader className="h-16 flex flex-row items-center px-4 border-b border-gray-800 space-y-0">
                        <SheetTitle className="text-white">
                            <Brand />
                        </SheetTitle>
                    </SheetHeader>
                    <nav className="flex-1 overflow-y-auto px-3 py-4">
                        {groups.map((group, i) => (
                            <NavGroup
                                key={i}
                                title={group.title}
                                items={group.items}
                                onNavigate={() => setMobileOpen(false)}
                            />
                        ))}
                    </nav>
                    <UserFooter user={user} onLogout={handleLogout} />
                </SheetContent>
            </Sheet>
        </>
    )
}
```

### Explained group by group

**`function UserFooter({ user, onLogout })`**
```jsx
function UserFooter({ user, onLogout }) {
    const { t } = useTranslation()
    const roleLabel = user.role ? t(`enums.role.${user.role}`) : ''
    ...
```
This is the small block shown at the bottom of the sidebar (user avatar, name, role, and now the language switcher plus logout button). `user.role` is a raw value from the API, like `'tenant_admin'`. The line `t(\`enums.role.${user.role}\`)` builds the key `'enums.role.tenant_admin'` and looks it up, resolving to `"Store Owner"` or `"صاحب المتجر"`.

Notice `<LanguageSwitcher />` is mounted directly inside `UserFooter`, right above the logout button. Because `UserFooter` itself is rendered *twice* in this file (once for the desktop sidebar, once for the mobile drawer — see below), this one addition automatically gives both the desktop and mobile views a working language switcher, with no extra code.

**`export default function Sidebar()`**
```jsx
const { t, dir } = useTranslation()
```
The main `Sidebar` component pulls out both `t` (for translated labels) and `dir` (for the one directional decision it needs to make — see below).

**The `groups` array**
```jsx
const groups = [
    { title: null, items: [
        { to: '/dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
    ] },
    { title: t('navigation.groups.operations'), items: [
        { to: '/orders', label: t('navigation.orders'), icon: ShoppingCart },
        ...
```
This builds the actual navigation menu structure at render time. Every `label` and group `title` is a call to `t(...)`, which means this entire array is rebuilt fresh every time the component re-renders — including every time the language changes, since a language change is exactly the kind of event that causes this component to re-render (see the Complete Data Flow section).

The `...(canSeeExpenses ? [...] : [])` pattern is unrelated to translation — it's how certain links are conditionally included only for users with the right role (`tenant_admin` or `store_manager`).

**The direction-aware drawer**
```jsx
<SheetContent side={dir === 'rtl' ? 'right' : 'left'} ...>
```
This is the fix for one of the real direction bugs found while building this system. `side` is a prop controlling which physical edge of the screen the mobile navigation drawer slides in from. Instead of hardcoding one side, it's computed from `dir`: in Arabic (reading starts on the right), the drawer opens from the right; in English, from the left.

### What imports this file

`src/App.jsx`, which mounts `<Sidebar />` on every authenticated route.

### What this file imports

`useTranslation` and `LanguageSwitcher`, plus routing, icons, and the `Sheet` UI primitives used for the mobile drawer.

### What data enters this file

The current `{ t, dir }` from `useTranslation()`, and the logged-in `user` object read directly from `localStorage`.

### What data leaves this file

Rendered navigation UI. It doesn't hand data back to the language system — it's purely a consumer.

---

## `src/pages/Expenses.jsx`

### Purpose, in simple language

The Expenses list page — filters, a table, pagination, and buttons to create/edit/delete expenses. This file is documented in full because it demonstrates every different *kind* of thing the translation system handles: plain text, computed enum keys, formatted currency, formatted dates, and direction-aware icons, all in one page.

### Complete current source code

```jsx
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import StatBoxes from '../components/StatBoxes'
import DeleteModal from '../components/DeleteModal'
import ExpenseModal from '../components/ExpenseModal'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { EXPENSE_CATEGORIES } from '../lib/enums'
import { formatCurrency, formatDate } from '../lib/format'

export default function Expenses() {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [totalAmount, setTotalAmount] = useState(0)
    const [stores, setStores] = useState([])

    const [category, setCategory] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [storeId, setStoreId] = useState('')

    const [modalOpen, setModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const { showToast } = useToast()
    const { t, lang, dir } = useTranslation()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const isAdmin = user.role === 'tenant_admin'
    const canManage = user.role === 'tenant_admin' || user.role === 'store_manager'

    const fetchExpenses = () => {
        setLoading(true)
        setError(false)
        api.get('/expenses', {
            params: {
                page,
                category: category || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                store_id: isAdmin ? (storeId || undefined) : undefined,
            },
        })
            .then(res => {
                setExpenses(res.data.data)
                setLastPage(res.data.meta.last_page)
                setTotalAmount(res.data.stats?.total_amount ?? 0)
            })
            .catch(() => {
                setError(true)
                showToast(t('expenses.loadFailed'), 'error')
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchExpenses() }, [page, category, dateFrom, dateTo, storeId])

    useEffect(() => {
        if (!isAdmin) return
        api.get('/stores').then(res => setStores(res.data.data)).catch(() => {})
    }, [])

    const canManageExpense = (expense) =>
        user.role === 'tenant_admin' ||
        (user.role === 'store_manager' && expense.creator?.id === user.id)

    const openCreate = () => {
        setEditingExpense(null)
        setModalOpen(true)
    }

    const openEdit = (expense) => {
        setEditingExpense(expense)
        setModalOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/expenses/${deleteTarget.id}`)
            setDeleteTarget(null)
            fetchExpenses()
            showToast(t('expenses.deleted'), 'success')
        } catch (err) {
            showToast(err.response?.data?.message || t('expenses.deleteFailed'), 'error')
            setDeleteTarget(null)
        } finally {
            setDeleting(false)
        }
    }

    const resetFilters = () => {
        setCategory('')
        setDateFrom('')
        setDateTo('')
        setStoreId('')
        setPage(1)
    }

    // Pagination arrows are physical, so they have to follow the reading
    // direction rather than being baked into the translated label.
    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    if (loading && expenses.length === 0) return <LoadingSpinner />

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">{t('expenses.title')}</h2>
                {canManage && (
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        + {t('expenses.addExpense')}
                    </button>
                )}
            </div>

            <StatBoxes stats={[
                { label: t('expenses.totalExpenses'), value: formatCurrency(totalAmount, lang), color: 'red' },
            ]} />

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <select
                    value={category}
                    onChange={e => { setCategory(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                    <option value="">{t('expenses.allCategories')}</option>
                    {EXPENSE_CATEGORIES.map(value => (
                        <option key={value} value={value}>{t(`enums.expenseCategory.${value}`)}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={dateFrom}
                    onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-500 text-sm hidden sm:inline">{t('common.to')}</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => { setDateTo(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />

                {isAdmin && (
                    <select
                        value={storeId}
                        onChange={e => { setStoreId(e.target.value); setPage(1) }}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="">{t('common.allStores')}</option>
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                )}

                {(category || dateFrom || dateTo || storeId) && (
                    <button
                        onClick={resetFilters}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {t('common.clearFilters')}
                    </button>
                )}
            </div>

            {error ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500">
                    {t('expenses.loadFailedRetry')}
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                {[
                                    'common.date',
                                    'expenses.category',
                                    'common.description',
                                    'common.store',
                                    'common.createdBy',
                                    'common.amount',
                                    'common.actions',
                                ].map(key => (
                                    <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {t(key)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {expenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                                        {formatDate(expense.expense_date, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">
                                        {t(`enums.expenseCategory.${expense.category}`)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">
                                        {expense.description || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                                        {expense.store?.name || t('common.allStores')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                                        {expense.creator?.name || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-red-400 text-sm font-semibold whitespace-nowrap">
                                        {formatCurrency(expense.amount, lang)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {canManageExpense(expense) && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEdit(expense)}
                                                    className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                                                >
                                                    {t('common.edit')}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(expense)}
                                                    className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                                                >
                                                    {t('common.delete')}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {expenses.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            {(category || dateFrom || dateTo || storeId)
                                ? t('expenses.emptyFiltered')
                                : t('expenses.empty')}
                        </div>
                    )}
                </div>
            )}

            {lastPage > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => setPage(p => p - 1)}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        <PrevIcon size={16} />
                        {t('common.previous')}
                    </button>
                    <span className="text-gray-400 text-sm">
                        {t('common.pageOf', { page, total: lastPage })}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page === lastPage}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        {t('common.next')}
                        <NextIcon size={16} />
                    </button>
                </div>
            )}

            {modalOpen && (
                <ExpenseModal
                    expense={editingExpense}
                    stores={stores}
                    isAdmin={isAdmin}
                    onClose={() => setModalOpen(false)}
                    onSuccess={fetchExpenses}
                />
            )}

            <DeleteModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                deleting={deleting}
                title={t('expenses.deleteExpense')}
                name={deleteTarget
                    ? `${t(`enums.expenseCategory.${deleteTarget.category}`)} — ${formatCurrency(deleteTarget.amount, lang)}`
                    : ''}
            />
        </div>
    )
}
```

### Explained group by group

**`const { t, lang, dir } = useTranslation()`**
This one line pulls out everything this page needs from the language system: `t` for text lookups, `lang` for formatting (currency, dates), and `dir` for the pagination arrows.

**The direction-aware pagination icons**
```jsx
const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight
```
This is a second real fix from the direction bugs described elsewhere in this document. The original code had the arrow baked directly into the translated string (`'→ السابق'`), which meant the arrow direction never adjusted for English. Now the icon is computed separately from the word, based on `dir`, so it always points the geometrically correct way regardless of language.

**A computed table-header key list**
```jsx
{[
    'common.date',
    'expenses.category',
    'common.description',
    'common.store',
    'common.createdBy',
    'common.amount',
    'common.actions',
].map(key => (
    <th key={key} ...>{t(key)}</th>
))}
```
An array of translation keys, mapped through `t()` one at a time. Notice these keys come from *two different namespaces* — most are `common.*` (shared across pages), but `expenses.category` is specific to this page — showing exactly how `common` and feature-specific namespaces are meant to be mixed together.

**An enum lookup built from live data**
```jsx
{t(`enums.expenseCategory.${expense.category}`)}
```
`expense.category` is raw data from the API (e.g., `"RENT"`). This builds and looks up `'enums.expenseCategory.RENT'`.

**Formatting calls, not translation calls**
```jsx
{formatDate(expense.expense_date, lang)}
...
{formatCurrency(expense.amount, lang)}
```
These are not `t()` calls — they're calls to the separate formatting helpers documented below. `expense.expense_date` and `expense.amount` are numbers/dates from the database being *reshaped* for display, not words being *translated*.

**Data left completely untouched**
```jsx
{expense.description || '—'}
...
{expense.creator?.name || '—'}
```
User-entered text and names are rendered exactly as stored — no `t()`, no formatting function. This is deliberate: these values are the shop's own data, not app vocabulary, and translating or reformatting them would corrupt what the user actually typed.

### What imports this file

`src/App.jsx`, as the component rendered at the `/expenses` route.

### What this file imports

`useTranslation`, `EXPENSE_CATEGORIES` (the list of valid category values, from `lib/enums.js`), and `formatCurrency`/`formatDate` (from `lib/format.js`), plus the `ExpenseModal`, `DeleteModal`, and other supporting components.

### What data enters this file

`{ t, lang, dir }` from `useTranslation()`, plus expense records fetched from the API.

### What data leaves this file

Rendered UI. It also triggers `showToast(...)` calls (using already-translated messages) and opens `ExpenseModal` and `DeleteModal`.

---

## `src/components/ExpenseModal.jsx`

### Purpose, in simple language

The create/edit form for a single expense, shown as a popup ("modal") over the Expenses page. Documented here to show how form validation messages and dynamic titles (`"Add Expense"` vs `"Edit Expense"`) are handled.

### Complete current source code

```jsx
import { useState } from 'react'
import api from '../api/axios'
import Modal from './Modal'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { EXPENSE_CATEGORIES } from '../lib/enums'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function ExpenseModal({ expense, stores, isAdmin, onClose, onSuccess }) {
    const isEdit = !!expense
    const [form, setForm] = useState({
        category: expense?.category || '',
        amount: expense?.amount ?? '',
        description: expense?.description || '',
        expense_date: expense?.expense_date || todayStr(),
        store_id: expense?.store?.id ?? '',
    })
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()
    const { t } = useTranslation()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.category) {
            showToast(t('expenses.categoryRequired'), 'error')
            return
        }
        if (!form.amount || parseFloat(form.amount) <= 0) {
            showToast(t('expenses.amountInvalid'), 'error')
            return
        }
        if (form.category === 'MISCELLANEOUS' && !form.description.trim()) {
            showToast(t('expenses.descriptionRequired'), 'error')
            return
        }

        setSaving(true)
        try {
            const payload = {
                category: form.category,
                amount: parseFloat(form.amount),
                description: form.description.trim() || null,
                expense_date: form.expense_date,
            }
            if (isAdmin && !isEdit) {
                payload.store_id = form.store_id || null
            }

            if (isEdit) {
                await api.patch(`/expenses/${expense.id}`, payload)
                showToast(t('expenses.updated'), 'success')
            } else {
                await api.post('/expenses', payload)
                showToast(t('expenses.created'), 'success')
            }
            onSuccess()
            onClose()
        } catch (err) {
            showToast(err.response?.data?.message || t('expenses.saveFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal open={true} onClose={onClose} title={isEdit ? t('expenses.editExpense') : t('expenses.newExpense')}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="text-gray-400 text-sm">{t('expenses.category')}</label>
                    <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                    >
                        <option value="">{t('expenses.chooseCategory')}</option>
                        {EXPENSE_CATEGORIES.map(value => (
                            <option key={value} value={value}>{t(`enums.expenseCategory.${value}`)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-gray-400 text-sm">{t('expenses.amountWithCurrency')}</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label className="text-gray-400 text-sm">{t('common.date')}</label>
                    <input
                        type="date"
                        value={form.expense_date}
                        max={todayStr()}
                        onChange={e => setForm({ ...form, expense_date: e.target.value })}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                    />
                </div>

                {isAdmin && !isEdit && (
                    <div>
                        <label className="text-gray-400 text-sm">
                            {t('common.store')} ({t('common.optional')})
                        </label>
                        <select
                            value={form.store_id}
                            onChange={e => setForm({ ...form, store_id: e.target.value })}
                            className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        >
                            <option value="">{t('expenses.generalExpense')}</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="text-gray-400 text-sm">
                        {t('common.notes')} {form.category === 'MISCELLANEOUS' && <span className="text-red-400">*</span>}
                    </label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={2}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm resize-none"
                        placeholder={t('expenses.notesPlaceholder')}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-gray-700 text-gray-300 rounded-lg py-2 hover:bg-gray-600 text-sm"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                        {saving ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
```

### Explained group by group

**`const { t } = useTranslation()`**
This component only needs `t` — it has no direction-sensitive icons and doesn't format any numbers directly (the parent `Expenses.jsx` handles that for the delete-confirmation message), so `lang` and `dir` aren't pulled out here.

**Validation messages**
```jsx
if (!form.category) {
    showToast(t('expenses.categoryRequired'), 'error')
    return
}
```
Each validation check has its message looked up from the bundle at the moment it fails, rather than being pre-computed. Notice the check itself — `if (!form.category)` — is completely unrelated to translation; only the *message shown after the check fails* goes through `t()`.

**The raw-value comparison that must never be translated**
```jsx
if (form.category === 'MISCELLANEOUS' && !form.description.trim()) {
```
This line compares `form.category` directly against the literal string `'MISCELLANEOUS'` — the raw backend value, not a translated word. If this were accidentally written as `if (t('enums.expenseCategory.MISCELLANEOUS') === form.category)` it would break, because `form.category` always holds the raw API value, never the display text.

**The dynamic modal title**
```jsx
<Modal open={true} onClose={onClose} title={isEdit ? t('expenses.editExpense') : t('expenses.newExpense')}>
```
A ternary decides *which key* to look up (`editExpense` or `newExpense`) based on whether an existing expense was passed in — but both branches still go through `t()`, so both are properly translated.

### What imports this file

`src/pages/Expenses.jsx`, which renders it conditionally when `modalOpen` is `true`.

### What this file imports

`useTranslation`, `EXPENSE_CATEGORIES`, plus `useToast` and the generic `Modal` wrapper component.

### What data enters this file

`{ t }` from `useTranslation()`, plus an optional `expense` object (present when editing, absent when creating) and the list of `stores`.

### What data leaves this file

An API call (`POST` or `PATCH` to `/expenses`), toast messages, and a call to `onSuccess()`/`onClose()` when done.

---

## `src/lib/format.js`

### Purpose, in simple language

This file handles a *different* problem from translation: reshaping numbers, currency, and dates to look correct in each language — without changing the actual value.

### Complete current source code

```js
// Locale-aware display formatting. Pass `lang` from useTranslation().
//
// Both languages use Western numerals and Latin digit grouping on purpose —
// that is the approved style for the Arabic UI. Only the currency symbol and
// its placement change with the language.

import { translate } from '../i18n/translate'

const NUMBER_LOCALE = 'en-US'

// en-GB gives dd/mm/yyyy, the shape already used across the app; the -u-nu-latn
// extension keeps Arabic month/weekday names but Western digits.
const dateLocale = (lang) => (lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB')

export function formatNumber(value, options = {}) {
    const num = Number(value)
    if (!Number.isFinite(num)) return '—'
    return num.toLocaleString(NUMBER_LOCALE, options)
}

// 1,250.00 ج.م  /  EGP 1,250.00
export function formatCurrency(value, lang) {
    const amount = formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (amount === '—') return amount

    const symbol = translate(lang, 'common.currency')
    return lang === 'ar' ? `${amount} ${symbol}` : `${symbol} ${amount}`
}

export function formatDate(value, lang, options) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString(dateLocale(lang), options)
}

export function formatDateTime(value, lang) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString(dateLocale(lang), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
```

### Explained group by group

**`import { translate } from '../i18n/translate'`**
This file needs to look up one word — the currency symbol — but it's not a React component, so it can't call `useTranslation()` (that hook only works inside components). Instead, it imports the plain `translate()` function directly, and the caller must pass in `lang` manually.

**`const NUMBER_LOCALE = 'en-US'`**
Both languages format numbers the same way — `1,250` with a comma, not `١,٢٥٠` with Arabic-Indic digits. This is a deliberate style choice for this app, not an accident.

**`const dateLocale = (lang) => (lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB')`**
Dates *do* differ slightly — this picks a JavaScript locale string. `ar-EG-u-nu-latn` means "Egyptian Arabic, but force Western numerals" (the `-u-nu-latn` part). `en-GB` gives the day/month/year order already used throughout the app.

**`formatNumber(value, options)`**
```js
export function formatNumber(value, options = {}) {
    const num = Number(value)
    if (!Number.isFinite(num)) return '—'
    return num.toLocaleString(NUMBER_LOCALE, options)
}
```
Converts whatever was passed in to an actual number, checks it's a real, finite number (not `NaN`, not `Infinity`, not something broken), and if it's fine, hands it to JavaScript's built-in `toLocaleString`, which does the actual comma-insertion work.

**`formatCurrency(value, lang)`**
```js
export function formatCurrency(value, lang) {
    const amount = formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    if (amount === '—') return amount

    const symbol = translate(lang, 'common.currency')
    return lang === 'ar' ? `${amount} ${symbol}` : `${symbol} ${amount}`
}
```
First formats the number with exactly two decimal places. Then looks up the currency symbol for the current language (`'ج.م'` or `'EGP'`). Then — and this is the detail easy to miss — the *position* of the symbol also changes: after the number in Arabic, before it in English. This single function is responsible for the difference between `"1,250.00 ج.م"` and `"EGP 1,250.00"`.

**`formatDate` and `formatDateTime`**
Both check for an empty or invalid input first (returning `'—'` rather than crashing or showing `"Invalid Date"`), then hand off to JavaScript's built-in date formatting, using the locale selected by `dateLocale(lang)`.

### What imports this file

`src/pages/Expenses.jsx`, `src/pages/Dashboard.jsx`, `src/pages/AuditLog.jsx`, `src/components/AuditLogDrawer.jsx`, and `src/lib/auditLog.js`.

### What this file imports

`translate` from `../i18n/translate`.

### What data enters this file

Raw values (numbers, date strings) and a `lang` code, passed in explicitly by whichever component calls these functions.

### What data leaves this file

Formatted display strings — never the raw value unchanged, and never a translated *word* (aside from the currency symbol).

---

## `src/lib/enums.js`

### Purpose, in simple language

Holds the list of valid backend category values, in the order they should appear in dropdowns — separate from their translated display labels.

### Complete current source code

```js
// Canonical backend enum values, in the order they should be listed in the UI.
// These are API contract values — send them raw, and render them through
// t(`enums.<group>.${value}`). Never send a translated label to the API.

// Matches Expense::CATEGORIES on the backend.
export const EXPENSE_CATEGORIES = [
    'SALARIES',
    'RENT',
    'UTILITIES',
    'TRANSPORTATION',
    'INTERNET',
    'MAINTENANCE',
    'SUPPLIES',
    'MISCELLANEOUS',
]
```

### Explained

This file is intentionally tiny — one exported array of raw strings, no translated text anywhere in it. It exists because of a specific problem: before this system was migrated, the *list* of categories and their *Arabic labels* were both stored together in one object (in the old `labels.js`). Once the labels moved into `en/enums.js` and `ar/enums.js`, something still needed to hold "what are all the valid categories, and in what order should they be shown" — and that job belongs here.

`Expenses.jsx` and `ExpenseModal.jsx` both use it the same way:
```jsx
{EXPENSE_CATEGORIES.map(value => (
    <option key={value} value={value}>{t(`enums.expenseCategory.${value}`)}</option>
))}
```
The **list and order** come from `lib/enums.js`. The **display word** for each item comes from the translation bundle. Two separate concerns, two separate files.

### What imports this file

`src/pages/Expenses.jsx` and `src/components/ExpenseModal.jsx`.

### What this file imports

Nothing.

### What data enters/leaves this file

Nothing dynamic — it's a static, hardcoded list matching the backend's `Expense::CATEGORIES`.

---

## `src/lib/labels.js`

### Purpose, in simple language

A **compatibility bridge**. Several pages in this project haven't been migrated to the new translation system yet, and they still import from this file expecting the old-style label objects. Rather than break them, this file now quietly redirects to the new Arabic bundle underneath.

### Complete current source code

```js
// DEPRECATED — compatibility shim, do not add anything here.
//
// Enum labels now live in src/i18n/{en,ar}/enums.js and are read through
// t(`enums.role.${user.role}`) etc. Pages that haven't been migrated to
// useTranslation() yet still import these maps, so they re-export the Arabic
// bundle to keep a single source of truth (no duplicated Arabic strings).
//
// Delete this file once nothing imports it.

import ar from '../i18n/ar/enums'

export const roleLabels = ar.role
export const paymentMethodLabels = ar.paymentMethod
export const paymentReferenceLabels = ar.paymentReference
export const expenseCategoryLabels = ar.expenseCategory
```

### Explained

**`import ar from '../i18n/ar/enums'`**
Instead of holding its own separate copy of the Arabic label text (which used to be the case, before this migration), this file now imports the *same* Arabic `enums` object described earlier in this document.

**The four export lines**
```js
export const roleLabels = ar.role
export const paymentMethodLabels = ar.paymentMethod
export const paymentReferenceLabels = ar.paymentReference
export const expenseCategoryLabels = ar.expenseCategory
```
Each line takes one piece off the real Arabic `enums` object and re-exports it under its *old* name, so that any file still written as `import { roleLabels } from '../lib/labels'` keeps working exactly as before, without ever knowing the underlying data actually now lives somewhere else. There is only **one** copy of the Arabic words in the entire system — this file just points an old name at it.

This is why it's called a **shim**: it's a thin compatibility layer that lets old code and new code coexist safely during a gradual migration, rather than forcing every file to be updated all at once.

### What imports this file

At the time of writing, six pages still not yet migrated to `useTranslation()`: among them `Settings.jsx`, `Reports.jsx`, `ReportPrint.jsx`, `CustomerBalance.jsx`, `SupplierBalance.jsx`, and `ReverseSupplierPaymentModal.jsx`.

### What this file imports

`ar` (the whole Arabic `enums` object) from `../i18n/ar/enums`.

### What data enters/leaves this file

Nothing dynamic — it's a static re-export. What "leaves" is simply a reference to the same objects already living inside the Arabic translation bundle.

---
---

# PART 2 — COMPLETE DATA FLOW

This section walks through the entire system as sixteen real events, from the moment a browser opens the app to the moment translated text appears on screen.

**1. The browser opens the application.**
The browser requests `index.html` and begins reading it top to bottom.

**2. Before React exists, the bootstrap script runs.**
The inline `<script>` inside `index.html` executes immediately:
```js
var lang = localStorage.getItem('lang')
if (lang !== 'en' && lang !== 'ar') return
document.documentElement.lang = lang
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
```
If a language was previously saved, `<html>` is corrected right away, before the user sees anything. If nothing was saved, the static `lang="ar" dir="rtl"` already in the HTML stands unchanged.

**3. `main.jsx` runs.**
The browser reaches `<script type="module" src="/src/main.jsx">` and starts executing it:
```jsx
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <LanguageProvider>
            <QueryClientProvider client={queryClient}>
                <App />
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </LanguageProvider>
    </StrictMode>,
)
```

**4. `LanguageProvider` is created.**
React begins running the function body of `LanguageProvider`, defined in `src/i18n/index.jsx`.

**5. The initial language is determined.**
```js
const [lang, setLangState] = useState(readStoredLang)
```
`useState` calls `readStoredLang` (from `translate.js`) exactly once, to get the starting value.

**6. `localStorage` is checked.**
Inside `readStoredLang()`:
```js
export function readStoredLang() {
    const stored = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.includes(stored) ? stored : DEFAULT_LANG
}
```
This reads the exact same `localStorage` key the bootstrap script already read in step 2 — confirming what was decided there, or falling back to `DEFAULT_LANG` (`'ar'`) if nothing valid was found.

**7. The language state is created.**
`lang` now holds a confirmed value (`'en'` or `'ar'`), stored in React's memory via `useState`. `dir` is calculated immediately after:
```js
const dir = lang === 'ar' ? 'rtl' : 'ltr'
```

**8. React Context makes the language system available.**
```jsx
const value = useMemo(() => {
    const setLang = (next) => { ... }
    return { lang, dir, setLang, t: (key, params) => translate(lang, key, params) }
}, [lang, dir])

return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
```
The `value` object is built and broadcast through `LanguageContext.Provider`. Every component inside `{children}` — which is the entire rest of the app — can now access it.

**9. Components render.**
React continues down the tree: `App`, then routes, then `Sidebar`, `Expenses`, and so on, each running as a normal JavaScript function that returns JSX.

**10. A component calls `useTranslation()`.**
For example, inside `Expenses.jsx`:
```jsx
const { t, lang, dir } = useTranslation()
```

**11. The component receives `t`, `lang`, `dir`, and `setLang`.**
`useTranslation()` (from `useTranslation.js`) runs `useContext(LanguageContext)`, which returns exactly the `value` object broadcast in step 8.

**12. The component calls `t('some.key')`.**
For example:
```jsx
<h2 className="text-2xl font-bold text-white">{t('expenses.title')}</h2>
```

**13. `translate()` receives the language and key.**
The `t` function received in step 11 was built like this:
```js
t: (key, params) => translate(lang, key, params)
```
So calling `t('expenses.title')` actually calls `translate('ar', 'expenses.title', undefined)` (or `translate('en', ...)`, depending on the current language) — `lang` was already baked in when `t` was created.

**14. The correct English or Arabic bundle is selected.**
Inside `translate()`:
```js
const value = lookup(bundles[lang], key)
```
`bundles[lang]` picks either the whole `en` object or the whole `ar` object.

**15. The dot-path key is followed through the nested translation object.**
Inside `lookup()`:
```js
key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), bundle)
```
`'expenses.title'.split('.')` becomes `['expenses', 'title']`. The `reduce` walks `bundle.expenses`, then `.title`, landing on the final string.

**16. The final text is returned, and React displays it.**
`translate()` returns `"Expenses"` or `"المصروفات"`. This string becomes the return value of `t('expenses.title')`, which React inserts directly into the `<h2>` element on the page.

---

# PART 3 — LANGUAGE SWITCH JOURNEY

This section traces one specific, real example: the user is currently using Arabic, clicks the language switcher, and chooses English.

### BEFORE

```
lang = 'ar'
dir  = 'rtl'
<html lang="ar" dir="rtl">
Sidebar is on the right edge of the screen
```

### USER ACTION

The user clicks the button labeled `EN`, inside `LanguageSwitcher.jsx`.

### CODE FLOW, step by step, with real code at each step

**Step 1 — `LanguageSwitcher.jsx`: the click is caught**
```jsx
<button
    key={option.lang}
    onClick={() => setLang(option.lang)}
    ...
>
```
For the `EN` button, `option.lang` is `'en'`, so this calls `setLang('en')`.

**Step 2 — `setLang` was obtained from `useTranslation()`**
```jsx
const { lang, setLang, t } = useTranslation()
```
`setLang` is not defined inside `LanguageSwitcher.jsx` at all — it was handed over via the Context broadcast, and it's actually defined inside `LanguageProvider`, in `src/i18n/index.jsx`.

**Step 3 — `setLang('en')` runs, inside `src/i18n/index.jsx`**
```js
const setLang = (next) => {
    if (!LANGUAGES.includes(next)) return
    localStorage.setItem(STORAGE_KEY, next)
    setLangState(next)
}
```
- `LANGUAGES.includes('en')` is `true`, so execution continues.

**Step 4 — `localStorage.setItem(...)`**
```js
localStorage.setItem(STORAGE_KEY, next)
// equivalent to: localStorage.setItem('lang', 'en')
```
The browser's saved notebook entry for `'lang'` is updated to `'en'`. This is what makes the choice survive a page refresh.

**Step 5 — React state update**
```js
setLangState(next)
// equivalent to: setLangState('en')
```
This is the call that actually changes React's in-memory `lang` value from `'ar'` to `'en'`.

**Step 6 — Provider re-renders**
Because `lang` changed, React re-runs the entire `LanguageProvider` function body from the top:
```js
const [lang, setLangState] = useState(readStoredLang)
// lang is now 'en'

const dir = lang === 'ar' ? 'rtl' : 'ltr'
// dir is now 'ltr'
```
`useMemo`'s dependency list `[lang, dir]` has changed, so a brand-new `value` object is built, with a brand-new `t` function baked to `'en'`:
```js
t: (key, params) => translate(lang, key, params)
// this new t always passes 'en' now
```

**Step 7 — Components using the Context re-render**
The new `value` object is broadcast through `<LanguageContext.Provider value={value}>`. React re-runs every component that called `useTranslation()` — `Sidebar`, `Expenses`, `ExpenseModal`, and anywhere else it's used — because the value they're listening to has changed.

**Step 8 — `document.documentElement.lang` changes**
This happens in the `useEffect` inside `LanguageProvider`, which runs after the render above:
```js
useEffect(() => {
    document.documentElement.lang = lang
    ...
}, [lang, dir])
```
`<html lang="ar">` becomes `<html lang="en">`.

**Step 9 — `document.documentElement.dir` changes**
Same `useEffect`, next line:
```js
document.documentElement.dir = dir
```
`<html dir="rtl">` becomes `<html dir="ltr">`.

**Step 10 — `document.title` updates**
```js
document.title = titles[lang]
```
Looked up from `titles = { en: 'MultiDukkan', ar: 'MultiDukkan' }` in `translate.js` — in this case, unchanged, since both languages currently use the same title.

**Step 11 — translations now resolve from the English bundle**
Every re-rendered component calling `t(...)` now gets English text, because their `t` function is the new one from Step 6, permanently pointing at `bundles.en` for this render cycle.

**Step 12 — the layout re-flows from RTL to LTR**
This is not caused by any additional JavaScript — it's the direct, automatic result of Step 9. CSS classes used throughout the app, like `lg:start-0` (on the Sidebar) and `text-start` (on table headers), are written in terms of "the side where reading starts," not a fixed physical side. The moment `dir="ltr"` takes effect, the browser itself recalculates what "start" means and redraws the page — sidebar on the left, text left-aligned — without React writing a single extra line of layout code.

**Step 13 — UI displays English**
The visible result: page text is now in English, `<html lang="en" dir="ltr">`, and the sidebar has moved to the left edge of the screen — all without a page reload, and without the API data cache (`QueryClientProvider`, which sits *inside* `LanguageProvider`) being disturbed at all.

### AFTER

```
lang = 'en'
dir  = 'ltr'
<html lang="en" dir="ltr">
Sidebar is on the left edge of the screen
```

---

# PART 4 — RTL AND LTR

### What `document.documentElement.lang` actually does

`document.documentElement` is JavaScript's way of reaching the `<html>` tag itself — the outermost element of the entire page. Setting `.lang` to `'en'` or `'ar'` tells the browser (and any assistive technology, like screen readers) what human language the page's content is written in. This affects things like which voice a screen reader uses and how the browser handles spell-checking or font fallback — it is not a purely cosmetic setting.

### What `document.documentElement.dir` actually does

`.dir` tells the browser which direction text should flow: `'ltr'` (left-to-right, for English) or `'rtl'` (right-to-left, for Arabic). This single attribute changes the *default reading direction* for the entire page, and every element inside it, unless overridden.

### Why changing `dir` from `rtl` to `ltr` affects the whole layout

This project's CSS (Tailwind utility classes) is written using **logical** properties rather than **physical** ones, wherever direction could matter. The difference:

- A physical class like `text-right` always means "align to the actual right edge of the screen" — it never changes, no matter what `dir` is set to.
- A logical class like `text-start` means "align to whichever edge reading begins on" — and the browser recalculates what that means every time `dir` changes.

Real examples from this project's code:

```jsx
// src/components/Sidebar.jsx
<aside className="... lg:start-0 ... border-e ...">
```
`start-0` means "pin to the reading-start edge." When `dir="rtl"`, that resolves to the right edge (matching Arabic's right-to-left reading), moving the sidebar to the right. When `dir="ltr"`, the exact same class resolves to the left edge.

```jsx
// src/pages/Expenses.jsx
const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight
```
This is a case where the direction decision *can't* be handled by CSS alone, because it's about which *icon* to show, not how to position an element. So the component reads `dir` directly and picks the geometrically correct arrow.

```jsx
// src/components/Sidebar.jsx
<SheetContent side={dir === 'rtl' ? 'right' : 'left'} ...>
```
Similarly, the mobile navigation drawer's opening side is a prop, not a CSS class, so it's computed directly from `dir` as well.

The underlying idea across all three examples: **anything with a "which side" decision must ask `dir`, rather than assuming a fixed physical answer** — because assuming a fixed answer only happens to be correct in whichever language it was originally written for.

---

# PART 5 — THE TRANSLATION LOOKUP JOURNEY

The task description asks for a trace of `t('expenses.form.amount')`. Before tracing it, one honest clarification: **this exact key does not exist anywhere in this project's actual translation files.** Looking at the real `src/i18n/en/expenses.js` and `src/i18n/ar/expenses.js` (both shown in full earlier in this document), the `expenses` namespace is completely flat — there is no `form` sub-object inside it. The real key for an expense amount label is `expenses.amountWithCurrency`, not `expenses.form.amount`.

Rather than inventing a fake nested structure that doesn't exist in the real code (which this document is committed to never doing), this section does two things: it traces `t('expenses.form.amount')` exactly as written, showing what the **real system genuinely does** when a key is missing — which is itself an important and real behavior to understand — and then it traces a key that **does** exist and **is** genuinely nested three levels deep, so the successful dot-path walk can also be shown accurately.

## Trace A — `t('expenses.form.amount')` (a key that does not exist)

**1. The component calls `t()`.**
```js
t('expenses.form.amount')
```

**2. Where `t()` comes from.**
From `useTranslation()`, ultimately built inside `LanguageProvider` in `src/i18n/index.jsx`:
```js
t: (key, params) => translate(lang, key, params)
```

**3. What language is currently selected.**
Say `lang` is `'ar'` at this moment. So this call becomes `translate('ar', 'expenses.form.amount', undefined)`.

**4. Which bundle is selected.**
Inside `translate()`:
```js
const value = lookup(bundles[lang], key)
```
`bundles['ar']` is chosen — the entire Arabic word library.

**5. How the string is split by dots.**
Inside `lookup()`:
```js
key.split('.')
// 'expenses.form.amount'.split('.') → ['expenses', 'form', 'amount']
```

**6. How the nested object is traversed.**
```
Start:  bundle = ar (the whole Arabic library)

Step 1: part = 'expenses'
        ar.expenses exists → { title: 'المصروفات', addExpense: '...', ... }
        node is now the expenses object

Step 2: part = 'form'
        expenses.form does NOT exist — there is no `form` key in
        src/i18n/ar/expenses.js
        node becomes undefined

Step 3: part = 'amount'
        the guard (node == null ? undefined : node[part]) catches this:
        node is undefined, so the result stays undefined
        (no crash — the guard from translate.js prevents one)
```

**7. What is returned.**
Back inside `translate()`:
```js
if (typeof value !== 'string') {
    if (import.meta.env.DEV) {
        console.warn(`[i18n] missing key "${key}" for lang "${lang}"`)
    }
    return key
}
```
`value` is `undefined`, and `typeof undefined` is `"undefined"`, not `"string"`. So this branch runs: in development, a warning is logged to the browser console (`[i18n] missing key "expenses.form.amount" for lang "ar"`), and the function returns the **key itself** — the literal text `"expenses.form.amount"`.

**8. What actually appears on screen.**
The literal string `expenses.form.amount` — in both languages, since the key doesn't exist in either bundle. This is the deliberate "fail visibly" design used throughout this project: a missing translation shows up as ugly, unmistakable text instead of a silent blank space, so it's impossible to miss during testing.

## Trace B — `t('dashboard.ai.cards.opportunity')` (a real key, three levels deep)

This key genuinely exists — see the `dashboard` namespace section earlier in this document.

**1–5.** Identical process: `t()` is called, `lang` is baked in, `translate()` selects the bundle for the current language, and the key is split: `['dashboard', 'ai', 'cards', 'opportunity']`.

**6. Traversing the real nested object, for `lang = 'ar'`:**
```
Start:  bundle = ar

Step 1: part = 'dashboard'
        ar.dashboard exists → { greetingWithName: '...', ai: {...}, ... }

Step 2: part = 'ai'
        dashboard.ai exists → { last30Days: '...', cards: {...}, ... }

Step 3: part = 'cards'
        ai.cards exists → { opportunity: 'فرصة', urgent: 'عاجل', trend: 'اتجاه' }

Step 4: part = 'opportunity'
        cards.opportunity → 'فرصة'
```

**7. The final value returned:**
- In Arabic: `'فرصة'`
- In English (tracing the identical path through `en/dashboard.js`): `'Opportunity'`

Both are real values from the real bundle files shown earlier in this document.

---

# PART 6 — ARCHITECTURE DIAGRAM

```
                    main.jsx
                       │
                       ▼
              <LanguageProvider>
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   useState        useEffect       useMemo
  (holds lang)   (syncs <html>)  (builds broadcast)
        │                              │
        └──────────────┬───────────────┘
                       ▼
              React Context
        (LanguageContext.Provider)
                       │
                       │  broadcasts { lang, dir, setLang, t }
                       │
        ┌──────────────┼──────────────┬─────────────┐
        ▼              ▼              ▼             ▼
   Sidebar.jsx   Expenses.jsx  ExpenseModal.jsx  LanguageSwitcher.jsx
        │              │              │             │
        └──────────────┴──────────────┴─────────────┘
                       │
              each calls useTranslation()
                       │
                       ▼
                     t('some.key')
                       │
                       ▼
                  translate(lang, key, params)
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
  bundles.en                    bundles.ar
  (English library)             (Arabic library)
        │                             │
        └──────────────┬──────────────┘
                       ▼
              dot-path lookup
           (walk the nested object)
                       │
                       ▼
              Final UI text
        ("Expenses" or "المصروفات")
```

---

# PART 7 — FILE RELATIONSHIP DIAGRAM

```
index.html
   │  loads
   ▼
src/main.jsx
   │  imports
   ▼
src/i18n/index.jsx  (LanguageProvider)
   │  imports                         │  imports
   ▼                                  ▼
src/i18n/useTranslation.js      src/i18n/translate.js
   │  exports LanguageContext         │  imports
   │  exports useTranslation()        ▼
   │                            src/i18n/en/index.js ─┬─ common.js
   │                            src/i18n/ar/index.js ─┤─ navigation.js
   │                                                   ├─ enums.js
   │                                                   ├─ auditLog.js
   │                                                   ├─ dashboard.js
   │                                                   └─ expenses.js
   │
   │  imported by every component below:
   │
   ├── src/components/LanguageSwitcher.jsx
   ├── src/components/Sidebar.jsx ──── imports ──── LanguageSwitcher.jsx
   ├── src/pages/Expenses.jsx ──────── imports ──── lib/enums.js
   │                             └──── imports ──── lib/format.js
   └── src/components/ExpenseModal.jsx ── imports ── lib/enums.js

src/lib/format.js
   │  imports
   ▼
src/i18n/translate.js   (directly — not through React)

src/lib/labels.js
   │  imports
   ▼
src/i18n/ar/enums.js   (directly — a compatibility shim)
```

---

# PART 8 — VARIABLE OWNERSHIP

| Variable / value | Lives in (file) | Notes |
|---|---|---|
| `lang` | `src/i18n/index.jsx` | The single React state value; the "whiteboard." Only `LanguageProvider` can write to it. |
| `dir` | `src/i18n/index.jsx` | Not stored — recalculated fresh every render from `lang` (`lang === 'ar' ? 'rtl' : 'ltr'`), so it can never disagree with `lang`. |
| `setLang` | `src/i18n/index.jsx` | Defined inside `LanguageProvider`. The only function in the app allowed to change `lang`. Broadcast to components via Context. |
| `t` | `src/i18n/index.jsx` (built), `src/i18n/translate.js` (does the work) | A new `t` function is created every time `lang` changes, with `lang` already baked in. |
| `LanguageContext` | `src/i18n/useTranslation.js` | The Context "channel" itself, created once with `createContext(null)`. |
| `bundles` | `src/i18n/translate.js` | `{ en, ar }` — both complete word libraries, loaded once when the app starts. |
| `DEFAULT_LANG` | `src/i18n/translate.js` | The constant `'ar'`. Used by `readStoredLang()` as the fallback. |
| `LANGUAGES` | `src/i18n/translate.js` | The constant array `['en', 'ar']`. Used to validate any language value before trusting it. |
| `STORAGE_KEY` | `src/i18n/translate.js` | The constant `'lang'`. Must match the key name used in the `index.html` bootstrap script. |

---

# PART 9 — BEGINNER EXPLANATIONS

Each concept below is explained using an actual line from this project.

### `import`

```js
import { useTranslation } from '../i18n/useTranslation'
```
This line says: "go find the file at `../i18n/useTranslation`, and give me the thing it named `useTranslation` when it exported it." Without `import`, a file can only use things defined inside itself — `import` is how one file borrows code that lives in another file.

### `export`

```js
export function useTranslation() {
    return useContext(LanguageContext)
}
```
`export` marks something as available to be borrowed by other files via `import`. Without the word `export` here, `useTranslation` would exist only inside this one file, and no other file could ever use it.

### `function`

```js
export function translate(lang, key, params) {
    ...
}
```
A function is a named, reusable block of instructions. This project needs functions because the same lookup logic (find a word, given a language and a key) has to run every single time any component displays any translated text — writing it out fresh every time would mean copying the same logic hundreds of times.

### `parameters`

```js
export function translate(lang, key, params) {
```
`lang`, `key`, and `params` are **parameters** — placeholder names for values the function expects to receive when it's called. When `translate('ar', 'expenses.title', undefined)` is called, `lang` becomes `'ar'`, `key` becomes `'expenses.title'`, and `params` becomes `undefined`, for the duration of that one function call.

### `return`

```js
if (typeof value !== 'string') {
    ...
    return key
}
return interpolate(value, params)
```
`return` is how a function hands a result back to whoever called it. This function has two different `return` statements — one for the "something went wrong" case, one for the "everything worked" case — and only one of them ever actually runs on any given call.

### `object`

```js
export const titles = { en: 'MultiDukkan', ar: 'MultiDukkan' }
```
An object is a collection of named values, written inside curly braces `{ }`. Here, `titles` is an object with two named properties, `en` and `ar`, each holding a string. This project uses objects constantly because they're the natural way to store "a word, looked up by name" — which is exactly what a dictionary needs to do.

### `nested object`

```js
// src/i18n/en/dashboard.js
ai: {
    cards: {
        opportunity: 'Opportunity',
        urgent: 'Urgent',
        trend: 'Trend',
    },
},
```
A nested object is an object stored as a property *inside* another object — here, `cards` is an object, and it lives inside `ai`, which is itself an object living inside the whole `dashboard` bundle. This mirrors how folders can contain other folders on a computer, which is exactly the analogy used earlier in this document for how `t('dashboard.ai.cards.opportunity')` finds its way to `'Opportunity'`.

### `array`

```js
export const LANGUAGES = ['en', 'ar']
```
An array is an ordered list of values, written inside square brackets `[ ]`. This one holds exactly two strings — the only two language codes this app actually supports. Code elsewhere checks membership in this list (`LANGUAGES.includes(next)`) as a safety check before trusting a value.

### `localStorage`

```js
localStorage.setItem(STORAGE_KEY, next)
...
const stored = localStorage.getItem(STORAGE_KEY)
```
`localStorage` is a small storage area the browser gives every website — a permanent notebook that survives closing the tab, closing the browser, and even restarting the computer. This project uses it to remember which language the user picked, so the choice isn't lost every time they revisit the app.

### `useState`

```js
const [lang, setLangState] = useState(readStoredLang)
```
`useState` is a built-in React tool for giving a component a piece of memory that React actively watches. It returns two things at once: the current value (`lang`) and a function to change it (`setLangState`). This project needs it because the current language has to be remembered *between* renders, and changing it has to actually cause the screen to update — plain JavaScript variables don't do that on their own.

### `useEffect`

```js
useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    document.title = titles[lang]
}, [lang, dir])
```
`useEffect` lets a component do something *after* React has finished updating the screen — typically something that reaches outside of React's normal control, like touching the raw `<html>` tag. The `[lang, dir]` at the end tells React to only re-run this block when `lang` or `dir` has actually changed, not on every unrelated render.

### `createContext`

```js
export const LanguageContext = createContext(null)
```
`createContext` reserves a "channel" that a value can be broadcast on, reachable by any component anywhere in the tree, without that value needing to be passed down manually through every layer in between. The `null` is the fallback value if nobody happens to be broadcasting on this channel.

### `useContext`

```js
export function useTranslation() {
    return useContext(LanguageContext)
}
```
`useContext` is how a component actually tunes in to a channel created by `createContext`. Calling `useContext(LanguageContext)` returns whatever the nearest `<LanguageContext.Provider>` above it in the tree is currently broadcasting.

### `React Provider`

```jsx
return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
```
A Provider is the component that actually does the broadcasting for a given Context. Anything rendered inside its opening and closing tags — here, `{children}`, meaning the entire rest of the app — can read `value` via `useContext`/`useTranslation`.

### `useMemo`

```js
const value = useMemo(() => {
    ...
    return { lang, dir, setLang, t: (key, params) => translate(lang, key, params) }
}, [lang, dir])
```
`useMemo` tells React "only rebuild this value if the listed ingredients (`[lang, dir]`) have actually changed since last time; otherwise, reuse the exact same object as before." This matters because React decides whether to re-render listening components partly by checking whether the broadcast object is a *new* object — without `useMemo`, a brand-new object would be built on every render for any reason, causing every component using `useTranslation()` to re-render constantly, even when the language hadn't changed at all.

### `reduce`

```js
key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), bundle)
```
`reduce` walks through every item in an array, carrying one running value forward and updating it at each step. Here, it starts by holding the whole `bundle` object, and at each step it replaces what it's holding with one level deeper into that object — this is the actual mechanism that walks a key like `'expenses.title'` down into the nested translation object.

### `split`

```js
key.split('.')
// 'expenses.title'.split('.') → ['expenses', 'title']
```
`split` breaks a single string into an array of smaller strings, cutting wherever the given character (here, a period `.`) appears. This turns a dot-separated key into a list of individual steps that `reduce` can then walk through one at a time.

### `ternary operator`

```js
const dir = lang === 'ar' ? 'rtl' : 'ltr'
```
A ternary is a compact way to write "if this condition is true, use this value, otherwise use that value" in a single line. Read as: "if `lang` equals `'ar'`, `dir` is `'rtl'`; otherwise, `dir` is `'ltr'`." This project uses ternaries constantly for exactly this kind of small, two-way decision.

### `optional values`

```jsx
{user.name?.charAt(0).toUpperCase()}
```
The `?.` here is "optional chaining" — it means "if `user.name` exists, go ahead and call `.charAt(0)` on it; if `user.name` is missing (`null` or `undefined`), stop immediately and produce `undefined` instead of crashing." This project uses it whenever a value might legitimately not exist yet, such as before user data has finished loading.

### `null`

```js
export const LanguageContext = createContext(null)
```
`null` represents "intentionally nothing" — a value deliberately set to indicate absence. Here, it means "if a component tries to read this Context and no Provider is actually broadcasting, they should get nothing (`null`), not an error."

### `undefined`

```js
key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), bundle)
```
`undefined` usually means "this was never given a value at all," as opposed to `null`'s "deliberately set to nothing." Here, `undefined` is what gets returned when a translation key's path leads somewhere that doesn't exist — a slightly different, unintentional kind of "nothing," which `translate()` specifically checks for afterward with `typeof value !== 'string'`.

---

# PART 10 — TEST YOUR UNDERSTANDING

Answer these using only what's in this document and the real project files.

1. Where does the current language live in memory while the app is running? Name the exact file and the exact line of code.

2. Which file is the *only* one allowed to change the language, and what is the name of the function inside it that does so?

3. What does `useTranslation()` actually return, and where does that returned object get built?

4. Walk through, in order, everything that happens after `setLang('en')` is called — name every file involved.

5. Where, specifically, is the selected language saved so it survives a page refresh? What is the exact key name used?

6. Trace `t('expenses.amountWithCurrency')` step by step: which file builds `t`, which file does the actual lookup, and what are the two possible final results?

7. What happens if a component calls `t('some.key.that.does.not.exist')`? Does the app crash? What does the user actually see?

8. Which file performs the actual dictionary lookup (the dot-path walk through the nested object)? Name the specific function.

9. Why do components like `Expenses.jsx` never read `localStorage` directly to find out the current language? What do they use instead, and why is that safer?

10. Name three specific things that change when the language flips from Arabic to English, and identify which file is responsible for each one.
