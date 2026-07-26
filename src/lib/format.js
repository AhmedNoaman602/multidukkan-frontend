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
