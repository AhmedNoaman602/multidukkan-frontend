// Search text compared the way the data is stored: Arabic and Persian digits typed or pasted into
// a search box become Western, and the hidden direction marks of a copied identifier are dropped,
// so ٢٠٢٦ finds invoice 2026-001.

import { toWesternDigits } from './number.js'

// Searches the server runs. The API interceptor passes every request's params through this.
const SEARCH_PARAMS = ['search', 'q']

export function normalizeSearchParams(params) {
    if (!params) return params
    const normalized = { ...params }
    for (const key of SEARCH_PARAMS) {
        if (typeof normalized[key] === 'string') normalized[key] = toWesternDigits(normalized[key])
    }
    return normalized
}

// Searches the browser runs over a list it already has: a case-insensitive "contains", with the
// digits of both sides in one form.
export function matchesSearch(value, query) {
    if (value === null || value === undefined) return false
    return toWesternDigits(value).toLowerCase().includes(toWesternDigits(query).toLowerCase())
}
