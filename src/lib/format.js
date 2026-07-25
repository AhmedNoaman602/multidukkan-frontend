// Locale-aware display formatting. Pass `lang` from useTranslation().
//
// Both languages use Western numerals and Latin digit grouping on purpose —
// that is the approved style for the Arabic UI. Only the currency symbol and
// its placement change with the language.

import { translate } from '../i18n/translate'

const NUMBER_LOCALE = 'en-US'
const DATE_LOCALE = 'en-GB' // dd/mm/yyyy — the shape already used across the app

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

export function formatDate(value) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString(DATE_LOCALE)
}
