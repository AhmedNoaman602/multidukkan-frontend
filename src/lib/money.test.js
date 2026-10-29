import { test } from 'node:test'
import assert from 'node:assert/strict'
import { priceText, roundMoney, roundPrice, roundTotal } from './money.js'

// Expected values were produced by PHP 8.4.21's round() on the same floats, so the screen and the
// server agree. A wider check (235,000 generated totals, prices and discounts) matched with no
// difference; these are the cases worth keeping in the repo.

test('totals round to piasters exactly like PHP, including floats just under or on a halfway point', () => {
    const cases = [
        [3.7055, 3.71],
        [3.7035, 3.7],
        [1.005, 1.01],
        [2.675, 2.68],
        [0.285, 0.29],
        [1.255, 1.26],
        [8.345, 8.35],
        [10.235, 10.24],
        [5.015, 5.02],
        [0.115, 0.12],
        [0.125, 0.13],
        [239075.79499999998, 239075.79],
        [913118.8449999999, 913118.84],
        [0.004, 0],
        [0.005, 0.01],
        [0.0049999, 0],
        [99999999.995, 100000000],
        [-1.005, -1.01],
        [-2.675, -2.68],
    ]
    for (const [value, php] of cases) assert.equal(roundTotal(value), php, `roundTotal(${value})`)
})

test('totals computed the way the server computes them match PHP', () => {
    assert.equal(roundTotal(3 * 0.335), 1.01)  // 1.0050000000000001
    assert.equal(roundTotal(3 * 1.2345), 3.7)  // 3.7035
    assert.equal(roundTotal(0.1 + 0.2), 0.3)   // 0.30000000000000004
})

test('Math.round(x * 100) / 100 is not PHP rounding, which is why roundTotal exists', () => {
    assert.equal(Math.round(1.005 * 100) / 100, 1)
    assert.equal(roundTotal(1.005), 1.01)
})

test('prices and costs round to 4 decimals like PHP', () => {
    const cases = [
        [0.05025, 0.0503],
        [0.0485, 0.0485],
        [0.04966666666666667, 0.0497],
        [64552.10354999999, 64552.1035],
        [1.23455, 1.2346],
        [0.00005, 0.0001],
        [48.5, 48.5],
    ]
    for (const [value, php] of cases) assert.equal(roundPrice(value), php, `roundPrice(${value})`)
    assert.equal(roundPrice(48.5 / 1000), 0.0485)
    assert.equal(roundPrice(50 / 12), 4.1667)
})

test('the weighted-average example depends on the quantities', () => {
    // 2 boxes (2000 pieces) at 0.0485, then 1 box (1000) at 0.052 — as the server weights them.
    assert.equal(roundPrice((2000 * 0.0485 + 1000 * 0.052) / 3000), 0.0497)
    // Equal quantities give the plain average.
    assert.equal(roundPrice((1000 * 0.0485 + 1000 * 0.052) / 2000), 0.0503)
})

test('roundMoney leaves zero and non-numbers alone', () => {
    assert.equal(roundMoney(0, 2), 0)
    assert.ok(Number.isNaN(roundMoney('abc', 2)))
    assert.equal(roundTotal('3.7035'), 3.7)
})

test('priceText gives a box value with 2 to 4 decimals and Western digits', () => {
    assert.equal(priceText('10.0000'), '10.00')
    assert.equal(priceText('2.5000'), '2.50')
    assert.equal(priceText('0.0485'), '0.0485')
    assert.equal(priceText('1.2340'), '1.234')
    assert.equal(priceText(48.5), '48.50')
    assert.equal(priceText(0.04966666), '0.0497')
    assert.equal(priceText('0'), '0.00')
})

test('priceText leaves an empty price empty', () => {
    assert.equal(priceText(null), '')
    assert.equal(priceText(undefined), '')
    assert.equal(priceText(''), '')
    assert.equal(priceText('abc'), '')
})

test('price and total formats keep Arabic digits and marks', async () => {
    const { formatNumber } = await import('./formatCore.js')
    const { PRICE_FORMAT, TOTAL_FORMAT } = await import('./money.js')
    assert.equal(formatNumber(roundPrice('0.0485'), PRICE_FORMAT, 'ar'), '٠٫٠٤٨٥')
    assert.equal(formatNumber(roundPrice('2.5000'), PRICE_FORMAT, 'ar'), '٢٫٥٠')
    assert.equal(formatNumber(roundPrice('1250.1234'), PRICE_FORMAT, 'ar'), '١٬٢٥٠٫١٢٣٤')
    assert.equal(formatNumber(roundTotal(1.005), TOTAL_FORMAT, 'ar'), '١٫٠١')
    assert.equal(formatNumber(roundPrice('0.0485'), PRICE_FORMAT, 'en'), '0.0485')
    assert.equal(formatNumber(roundTotal(1.005), TOTAL_FORMAT, 'en'), '1.01')
})

test('the default sale price keeps 4 decimals', async () => {
    const { defaultSalePrice } = await import('./saleLine.js')
    const nails = { price: '0.0485', price_a: '0.0450', conversion_factor: 1000 }
    assert.equal(defaultSalePrice(nails, 'default', 'base'), 0.0485)
    assert.equal(defaultSalePrice(nails, 'a', 'base'), 0.045)
    assert.equal(defaultSalePrice(nails, 'default', 'secondary'), 48.5)
    assert.equal(defaultSalePrice({ price: '1.2345', conversion_factor: 3 }, 'default', 'secondary'), 3.7035)
})
