// Locale-aware display formatting. The language-independent part lives in formatCore.js so it
// can be unit-tested; this module adds formatCurrency, which needs the translated symbol.

import { translate } from '../i18n/translate'
import { formatNumber, getDisplayLanguage } from './formatCore'

export {
    TIME_OPTS,
    formatDate,
    formatDateTime,
    formatNumber,
    formatTime,
    formatUnitBreakdown,
    getDisplayLanguage,
    setDisplayLanguage,
    toDisplayDigits,
} from './formatCore'

// ١٬٢٥٠٫٠٠ ج.م  /  EGP 1,250.00
export function formatCurrency(value, lang = getDisplayLanguage()) {
    const amount = formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, lang)
    if (amount === '—') return amount

    const symbol = translate(lang, 'common.currency')
    return lang === 'ar' ? `${amount} ${symbol}` : `${symbol} ${amount}`
}
