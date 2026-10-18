// Typed numbers in any script become one plain form: "١٢٫٥" and "۱۲٫۵" → "12.5".
// A plain comma is rejected rather than guessed — "12,5" could mean 12.5 or 125.
// Non-negative only: every field using this (money, quantities, factors, thresholds) has a
// floor of 0 or more, so "-" is rejected. A signed field would need its own rule.

const ARABIC_DECIMAL = '٫'   // ٫
const ARABIC_THOUSANDS = '٬' // ٬

// Invisible direction marks pasted RTL text can carry. Spaces are not in this list:
// "12 5" must not quietly become 125.
const DIRECTION_MARKS = /[‎‏؜‪-‮⁦-⁩]/g

const toWesternDigit = (d) => {
    const code = d.charCodeAt(0)
    return String(code - (code >= 0x06F0 ? 0x06F0 : 0x0660))
}

// Returns { text, error }: text is the normalized string ('' when empty), error is one of
// 'comma' | 'spaces' | 'thousands' | 'invalid' | 'incomplete' | 'integer' | 'decimals', or null.
//
// `typing: true` is for a field being edited: any space is an error (trimming it would let the
// next digit join on), and a lone "." is 'incomplete' rather than a number. Without it — the
// final parse — surrounding spaces are trimmed and a lone "." is simply invalid.
export function normalizeNumberText(raw, { decimals = 2, typing = false } = {}) {
    let text = String(raw ?? '').replace(DIRECTION_MARKS, '')
    if (!typing) text = text.trim()

    if (/[,،]/.test(text)) return { text: null, error: 'comma' }
    if (/\s/.test(text)) return { text: null, error: 'spaces' }

    text = text.replace(/[٠-٩۰-۹]/g, toWesternDigit).replaceAll(ARABIC_DECIMAL, '.')

    if (text.includes(ARABIC_THOUSANDS)) {
        if (!/^\d{1,3}(٬\d{3})+(\.\d*)?$/.test(text)) return { text: null, error: 'thousands' }
        text = text.replaceAll(ARABIC_THOUSANDS, '')
    }

    if (!/^\d*\.?\d*$/.test(text)) return { text: null, error: 'invalid' }
    if (text === '.') return { text: null, error: typing ? 'incomplete' : 'invalid' }
    if (text.startsWith('.')) text = `0${text}`

    const [whole, digits] = text.split('.')
    if (digits !== undefined && digits.length > decimals && /^0*$/.test(digits.slice(decimals))) {
        const kept = digits.slice(0, decimals)
        text = kept ? `${whole}.${kept}` : whole
    }

    const fraction = text.split('.')[1]
    if (fraction !== undefined && decimals === 0) return { text: null, error: 'integer' }
    if (fraction !== undefined && fraction.length > decimals) return { text: null, error: 'decimals' }

    return { text, error: null }
}

// Screens without a <form> get no native submit check, so they call this before saving.
// Only format and range errors count; an empty required field is left to the page.
export function reportInvalidNumberInput() {
    const input = [...document.querySelectorAll('input[data-number-input]')].find(el => el.validity.customError)
    if (!input) return false
    input.reportValidity()
    input.focus()
    return true
}

// The final parse, for submitting: null for an empty value, NaN for an invalid one — never a
// silent 0.
export function parseNumber(raw, options) {
    const { text, error } = normalizeNumberText(raw, { ...options, typing: false })
    if (error) return NaN
    if (text === '') return null
    return Number(text)
}
