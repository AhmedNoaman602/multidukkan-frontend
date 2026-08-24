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

// 12-hour clock everywhere: "3:42 pm" in English, "3:42 م" in Arabic.
//
// hour12 is set explicitly rather than left to the locale — en-GB defaults to a
// 24-hour clock while ar-EG defaults to 12-hour, so without this the same screen
// reads differently in each language. `hour: 'numeric'` (not '2-digit') gives
// "3:42 pm" rather than "03:42 pm".
//
// en-GB renders a lowercase marker; switch the English locale to en-US here if
// uppercase "PM" is wanted.
export const TIME_OPTS = { hour: 'numeric', minute: '2-digit', hour12: true }

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
        ...TIME_OPTS,
    })
}

// Time only — "3:42 PM". Pass `options` to override, e.g. a fixed timeZone.
export function formatTime(value, lang, options = {}) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleTimeString(dateLocale(lang), { ...TIME_OPTS, ...options })
}
