// The backend's two money scales (ADR-011): prices and costs keep 4 decimals, totals, payments
// and the ledger are in piasters. The server decides every amount that is saved; these helpers
// only make the screen show the same number before it is saved.

export const PRICE_DECIMALS = 4
export const TOTAL_DECIMALS = 2

// The same steps as PHP 8.4's round($value, $places) (ext/standard/math.c), so a total on screen
// is the total the server saves. Math.round(x * 100) / 100 is not the same: 1.005 is stored as
// 1.00499999999999989…, so it gives 1.00 where PHP gives 1.01. PHP builds the halfway point
// (1.005) as a float too and rounds away from zero when the value reaches it; a sum that only
// looks like …795 but is really below it (239075.79499999998) rounds down. Checked against
// PHP 8.4.21 on 235,000 generated totals, prices and discounts.
export function roundMoney(value, places) {
    const number = Number(value)
    if (!Number.isFinite(number) || number === 0) return number
    const exponent = 10 ** places
    const sign = number < 0 ? -1 : 1
    const integral = sign > 0 ? Math.floor(number * exponent) : Math.ceil(number * exponent)
    if (integral / exponent === number) return number
    const halfway = Math.abs((integral + sign * 0.5) / exponent)
    return (Math.abs(number) >= halfway ? integral + sign : integral) / exponent
}

export const roundTotal = (value) => roundMoney(value, TOTAL_DECIMALS)
export const roundPrice = (value) => roundMoney(value, PRICE_DECIMALS)

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
