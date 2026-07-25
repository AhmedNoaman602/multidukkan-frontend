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
