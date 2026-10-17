import { test } from 'node:test'
import assert from 'node:assert/strict'
import { changeLinePrice, changeLineUnit, confirmLinePrice, convertLinePrice, convertedPrice, needsPriceReview, newLine, suggestedPrice } from './purchaseLine.js'

// Nails: piece is the base unit, a box holds 1000. The supplier's cost is 0.05 a piece.
const nails = { id: 7, conversion_factor: 1000 }
const PIECE_COST = 0.05

test('a new line starts per piece at the suggested per-piece cost', () => {
    const line = newLine(nails, PIECE_COST)

    assert.equal(line.unit_type, 'base')
    assert.equal(line.unit_price, 0.05)
    assert.equal(line.price_source, 'suggested')
    assert.equal(line.piece_cost, 0.05)
    assert.equal(needsPriceReview(line), false)
})

test('a suggested price follows the unit: piece → box multiplies by the box size, box → piece goes back', () => {
    const box = changeLineUnit(newLine(nails, PIECE_COST), 'secondary', nails.conversion_factor)
    assert.equal(box.unit_type, 'secondary')
    assert.equal(box.unit_price, 50)
    assert.equal(needsPriceReview(box), false)

    const piece = changeLineUnit(box, 'base', nails.conversion_factor)
    assert.equal(piece.unit_price, 0.05)
})

test('repeated switching always recalculates from the original per-piece cost, never from the shown price', () => {
    const dozen = { id: 8, conversion_factor: 12 }
    let line = newLine(dozen, 1.04)

    for (let i = 0; i < 25; i++) {
        line = changeLineUnit(line, 'secondary', 12)
        assert.equal(line.unit_price, 12.48)
        line = changeLineUnit(line, 'base', 12)
        assert.equal(line.unit_price, 1.04)
    }
    assert.equal(line.piece_cost, 1.04)

    // Even if the stored price were somehow off, the next switch comes from piece_cost.
    const drifted = changeLineUnit({ ...line, unit_price: 9.99 }, 'secondary', 12)
    assert.equal(drifted.unit_price, 12.48)
})

test('a typed price is kept on a unit switch and flagged for review', () => {
    const typed = changeLinePrice(newLine(nails, PIECE_COST), '50')
    assert.equal(typed.price_source, 'typed')

    const switched = changeLineUnit(typed, 'secondary', nails.conversion_factor)
    assert.equal(switched.unit_type, 'secondary')
    assert.equal(switched.unit_price, '50')
    assert.equal(needsPriceReview(switched), true)
})

test('reviewing clears the flag: confirming keeps the price, typing a new one replaces it', () => {
    const flagged = changeLineUnit(changeLinePrice(newLine(nails, PIECE_COST), '50'), 'secondary', 1000)

    const confirmed = confirmLinePrice(flagged)
    assert.equal(needsPriceReview(confirmed), false)
    assert.equal(confirmed.unit_price, '50')

    const retyped = changeLinePrice(flagged, '48.5')
    assert.equal(needsPriceReview(retyped), false)
    assert.equal(retyped.unit_price, '48.5')
})

test('Keep leaves the typed price exactly as entered for the new unit', () => {
    const flagged = changeLineUnit(changeLinePrice(newLine(nails, PIECE_COST), '48'), 'secondary', 1000)
    assert.equal(flagged.price_unit, 'base')

    const kept = confirmLinePrice(flagged)
    assert.equal(kept.unit_type, 'secondary')
    assert.equal(kept.unit_price, '48')
    assert.equal(needsPriceReview(kept), false)
})

test('Convert re-expresses the typed price in the new unit: piece → box multiplies, box → piece divides', () => {
    const toBox = changeLineUnit(changeLinePrice(newLine(nails, PIECE_COST), '0.06'), 'secondary', 1000)
    assert.equal(convertedPrice(toBox, 1000), 60)
    const boxLine = convertLinePrice(toBox, 1000)
    assert.equal(boxLine.unit_price, 60)
    assert.equal(boxLine.price_source, 'typed')
    assert.equal(needsPriceReview(boxLine), false)

    const boxTyped = changeLinePrice({ ...newLine(nails, PIECE_COST), unit_type: 'secondary' }, '48')
    const toPiece = convertLinePrice(changeLineUnit(boxTyped, 'base', 1000), 1000)
    assert.equal(toPiece.unit_price, 0.05) // 0.048 rounded to the server's 2 decimals
})

test('switching back to the unit the price was typed for clears the flag and keeps the price', () => {
    const dozen = 12
    const flagged = changeLineUnit(changeLinePrice(newLine({ id: 8, conversion_factor: dozen }, 1), '2'), 'secondary', dozen)

    const back = changeLineUnit(flagged, 'base', dozen)
    assert.equal(back.unit_price, '2')
    assert.equal(needsPriceReview(back), false)
    assert.equal(convertedPrice(flagged, dozen), 24)
})

test('Convert is unavailable for a flag with no known source unit', () => {
    const unknown = { unit_type: 'secondary', unit_price: '5', price_review: true }
    assert.equal(convertedPrice(unknown, 1000), null)
    assert.equal(convertLinePrice(unknown, 1000), unknown)
})

test('a draft saved before this change (no price_source) is treated as a typed price', () => {
    const legacy = { product_id: '7', quantity: 2, warehouse_id: '3', unit_type: 'base', unit_price: '0.05' }

    const switched = changeLineUnit(legacy, 'secondary', nails.conversion_factor)
    assert.equal(switched.unit_price, '0.05')
    assert.equal(needsPriceReview(switched), true)
})

test('a product without a box unit cannot switch to box', () => {
    const loose = { id: 9, conversion_factor: null }
    const line = newLine(loose, 3.5)

    assert.equal(changeLineUnit(line, 'secondary', null), line)
    assert.equal(changeLineUnit(line, 'secondary', 0), line)
})

test('choosing the unit the line already has changes nothing', () => {
    const line = changeLinePrice(newLine(nails, PIECE_COST), '0.06')
    assert.equal(changeLineUnit(line, 'base', 1000), line)
})

test('suggestedPrice handles a missing cost as 0 and mirrors the backend box-size rule', () => {
    assert.equal(suggestedPrice(null, 'secondary', 1000), 0)
    assert.equal(suggestedPrice(0.05, 'base', 1000), 0.05)
    assert.equal(suggestedPrice(0.05, 'secondary', 0), 0.05)
})
