// Locale-aware display formatting with no i18n imports, so it can be unit-tested with node --test.
// Import from lib/format, which re-exports this plus formatCurrency.
//
// Arabic screens show Arabic digits with the Arabic thousands and decimal marks (١٬٢٥٠٫٥٠),
// the way the shop's previous system printed them. English screens use Western digits.
// Display only: values sent to the API and kept in state stay Western.

// Set by LanguageProvider whenever the language changes; 'ar' matches DEFAULT_LANG.
let displayLanguage = 'ar'

export function setDisplayLanguage(lang) {
    displayLanguage = lang
}

export const getDisplayLanguage = () => displayLanguage

const numberLocale = (lang) => (lang === 'ar' ? 'ar-EG' : 'en-US')

// en-GB gives dd/mm/yyyy, the shape already used across the app; ar-EG gives the same order
// with Arabic digits and Arabic month and weekday names.
const dateLocale = (lang) => (lang === 'ar' ? 'ar-EG' : 'en-GB')

// 12-hour clock everywhere: "3:42 pm" in English, "٣:٤٢ م" in Arabic.
//
// hour12 is set explicitly rather than left to the locale — en-GB defaults to a
// 24-hour clock while ar-EG defaults to 12-hour, so without this the same screen
// reads differently in each language. `hour: 'numeric'` (not '2-digit') gives
// "3:42 pm" rather than "03:42 pm".
export const TIME_OPTS = { hour: 'numeric', minute: '2-digit', hour12: true }

export function formatNumber(value, options = {}, lang = displayLanguage) {
    const num = Number(value)
    if (!Number.isFinite(num)) return '—'
    return num.toLocaleString(numberLocale(lang), options)
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

// Digits inside identifiers (invoice numbers, SKUs, phone numbers) in the display language.
// Only the digits change; letters, hyphens and spaces stay as they are.
export function toDisplayDigits(text, lang = displayLanguage) {
    if (text === null || text === undefined) return ''
    const value = String(text)
    return lang === 'ar' ? value.replace(/[0-9]/g, (d) => ARABIC_DIGITS[d]) : value
}

// Base-unit stock in readable form: 44 with a 12-piece box → "44 pcs (3 box + 8 pcs)".
// Display only — the backend stores and moves base units.
export function formatUnitBreakdown(quantity, { unit, secondary_unit, conversion_factor } = {}) {
    const qty = Number(quantity) || 0
    const base = `${formatNumber(qty)}${unit ? ` ${unit}` : ''}`
    const factor = Number(conversion_factor)
    if (!secondary_unit || !(factor > 1) || qty < factor) return base

    const packs = Math.floor(qty / factor)
    const loose = qty % factor
    const breakdown = loose
        ? `${formatNumber(packs)} ${secondary_unit} + ${formatNumber(loose)}${unit ? ` ${unit}` : ''}`
        : `${formatNumber(packs)} ${secondary_unit}`
    return `${base} (${breakdown})`
}

export function formatDate(value, lang = displayLanguage, options) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString(dateLocale(lang), options)
}

export function formatDateTime(value, lang = displayLanguage) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString(dateLocale(lang), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...TIME_OPTS,
    })
}

// Time only — "3:42 PM". Pass `options` to override, e.g. a fixed timeZone.
export function formatTime(value, lang = displayLanguage, options = {}) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleTimeString(dateLocale(lang), { ...TIME_OPTS, ...options })
}
