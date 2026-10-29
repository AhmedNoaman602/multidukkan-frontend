// The backend's two money scales (ADR-011): prices and costs keep 4 decimals, totals, payments
// and the ledger are in piasters. The server decides every amount that is saved; these helpers
// only make the screen show the same number before it is saved.

export const PRICE_DECIMALS = 4
export const TOTAL_DECIMALS = 2

const halfUp = (value) => (value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5))

// The same steps as PHP 8.3's round($value, $places) (ext/standard/math.c), the version the live
// server runs, so a total on screen is the total the server saves. PHP 8.3 first rounds to the 15
// digits a float holds, then half away from zero: 1.005 (stored as 1.00499999999999989…) gives
// 1.01 and 63.214999999999996 gives 63.22. PHP 8.4 dropped that first step (63.21), so this must
// change if the server moves to 8.4. Math.round(x * 100) / 100 matches neither. Checked against
// PHP 8.3.31 on 2.9 million generated totals, prices, discounts and edge values.
export function roundMoney(value, places) {
    const number = Number(value)
    if (!Number.isFinite(number) || number === 0) return number
    const preciseDigits = 14 - Math.floor(Math.log10(Math.abs(number)))
    let scaled
    if (preciseDigits > places && preciseDigits - 15 < places) {
        const digits = Math.max(-60, preciseDigits)
        scaled = halfUp(digits >= 0 ? number * 10 ** digits : number / 10 ** -digits)
        scaled /= 10 ** Math.abs(Math.max(-60, places - digits))
    } else {
        scaled = number * 10 ** places
        if (Math.abs(scaled) >= 1e15) return number
    }
    return halfUp(scaled) / 10 ** places
}

export const roundTotal = (value) => roundMoney(value, TOTAL_DECIMALS)
export const roundPrice = (value) => roundMoney(value, PRICE_DECIMALS)

// Money::total() on the backend: a sum or difference is snapped to 4 decimals first, so float
// noise (2.885 − 0.92 = 1.96499…) can't flip the piaster.
export const moneyTotal = (value) => roundTotal(roundPrice(value))

// OrderService's steps: the exact subtotal, the discount (a percent rounded to piasters, never more
// than the subtotal), then Money::total(). `lineSum` is the unrounded sum of price × quantity.
export function orderTotals(lineSum, discountType, discountValue) {
    const subtotal = roundPrice(lineSum)
    const value = parseFloat(discountValue) || 0
    const asked = discountType === 'percent' ? roundTotal(subtotal * value / 100) : value
    const discount = Math.max(0, Math.min(asked, subtotal))
    return { subtotal, discount, total: moneyTotal(subtotal - discount) }
}

// formatNumber options: totals always show piasters, prices show 2 to 4 decimals (2.50, 0.0485).
export const TOTAL_FORMAT = { minimumFractionDigits: TOTAL_DECIMALS, maximumFractionDigits: TOTAL_DECIMALS }
export const PRICE_FORMAT = { minimumFractionDigits: TOTAL_DECIMALS, maximumFractionDigits: PRICE_DECIMALS }

// A price for a form box: "2 to 4 decimals as needed", Western digits like every box value.
// The API sends "10.0000"; the box shows 10.00, 2.50 or 0.0485.
export function priceText(value) {
    if (value === null || value === undefined || value === '') return ''
    const number = Number(value)
    if (!Number.isFinite(number)) return ''
    const [whole, fraction] = roundPrice(number).toFixed(PRICE_DECIMALS).split('.')
    return `${whole}.${fraction.replace(/0+$/, '').padEnd(TOTAL_DECIMALS, '0')}`
}
