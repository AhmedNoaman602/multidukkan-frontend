import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultSalePrice } from './saleLine.js'

// A box holds 12 pieces. Prices come from the API as strings.
const product = { price: '10.00', price_a: '9.00', price_b: null, conversion_factor: 12 }

test('a default-tier customer gets the normal piece price', () => {
    assert.equal(defaultSalePrice(product, 'default', 'base'), 10)
})

test('a tier customer gets the tier price, and a box multiplies it by the box size', () => {
    assert.equal(defaultSalePrice(product, 'a', 'base'), 9)
    assert.equal(defaultSalePrice(product, 'a', 'secondary'), 108)
})

test('an empty tier price falls back to the normal price', () => {
    assert.equal(defaultSalePrice(product, 'b', 'secondary'), 120)
})

test('a tier price of zero is kept, like the server does', () => {
    assert.equal(defaultSalePrice({ ...product, price_a: '0.00' }, 'a', 'base'), 0)
})

test('a product without a box ignores the secondary unit', () => {
    assert.equal(defaultSalePrice({ price: '10.00', conversion_factor: null }, 'default', 'secondary'), 10)
})

test('a missing tier is treated as default', () => {
    assert.equal(defaultSalePrice(product, undefined, 'secondary'), 120)
})
