// Locale-aware display formatting. The language-independent part lives in formatCore.js so it
// can be unit-tested; this module adds formatCurrency and formatPrice, which need the translated
// symbol.

import { translate } from '../i18n/translate'
import { formatNumber, getDisplayLanguage } from './formatCore'
import { PRICE_FORMAT, TOTAL_FORMAT, roundPrice, roundTotal } from './money'

export {
    TIME_OPTS,
    formatCode,
    formatDate,
    formatDateTime,
    formatIdentifier,
    formatNumber,
    formatPercent,
    formatTime,
    formatUnitBreakdown,
    getDisplayLanguage,
    setDisplayLanguage,
    toDisplayDigits,
} from './formatCore'

function withSymbol(amount, lang) {
    if (amount === '—') return amount
    const symbol = translate(lang, 'common.currency')
    return lang === 'ar' ? `${amount} ${symbol}` : `${symbol} ${amount}`
}

// Totals, payments, balances: piasters, rounded the way the server rounds them (ADR-011).
// ١٬٢٥٠٫٠٠ ج.م  /  EGP 1,250.00
export function formatCurrency(value, lang = getDisplayLanguage()) {
    return withSymbol(formatNumber(roundTotal(value), TOTAL_FORMAT, lang), lang)
}

// A price or cost per piece or box: 2 to 4 decimals.
// ٠٫٠٤٨٥ ج.م  /  EGP 0.0485,  ٢٫٥٠ ج.م  /  EGP 2.50
export function formatPrice(value, lang = getDisplayLanguage()) {
    return withSymbol(formatNumber(roundPrice(value), PRICE_FORMAT, lang), lang)
}
