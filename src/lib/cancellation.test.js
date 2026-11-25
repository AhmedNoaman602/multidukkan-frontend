import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canConfirmCancel, settlementOptions } from './cancellation.js'

const preview = (overrides = {}) => ({
    settlement_required: true,
    settlements: ['cash', 'credit'],
    cash_payout_available: true,
    credit_blocked_reason: null,
    blocked_reason: null,
    ...overrides,
})

test('an unpaid invoice needs no choice and can be cancelled', () => {
    const choices = settlementOptions(preview({ settlement_required: false }))

    assert.deepEqual(choices, { blockedReason: null, options: [], preselected: null })
    assert.equal(canConfirmCancel(choices, null), true)
})

test('with both choices allowed, nothing is preselected and the owner must pick one', () => {
    const choices = settlementOptions(preview())

    assert.deepEqual(choices.options.map(o => o.value), ['cash', 'credit'])
    assert.equal(choices.preselected, null)
    assert.equal(canConfirmCancel(choices, null), false)
    assert.equal(canConfirmCancel(choices, 'credit'), true)
})

test('a walk-in invoice offers cash only, preselected', () => {
    const choices = settlementOptions(preview({ settlements: ['cash'] }))

    assert.deepEqual(choices.options, [{ value: 'cash', disabledReason: null }])
    assert.equal(choices.preselected, 'cash')
})

test('credit is disabled with its reason while other invoices are unpaid', () => {
    const choices = settlementOptions(preview({ credit_blocked_reason: 'other_unpaid_invoices' }))

    assert.deepEqual(choices.options[1], { value: 'credit', disabledReason: 'other_unpaid_invoices' })
    assert.equal(choices.preselected, 'cash')
    assert.equal(canConfirmCancel(choices, 'credit'), false)
})

test('cash is disabled when the store credit used cannot be paid out', () => {
    const choices = settlementOptions(preview({ cash_payout_available: false }))

    assert.deepEqual(choices.options[0], { value: 'cash', disabledReason: 'credit_payout_unavailable' })
    assert.equal(choices.preselected, 'credit')
})

test('with both choices refused, the cancel is blocked', () => {
    const choices = settlementOptions(preview({
        cash_payout_available: false,
        credit_blocked_reason: 'other_unpaid_invoices',
    }))

    assert.equal(choices.blockedReason, 'no_settlement_available')
    assert.equal(choices.preselected, null)
    assert.equal(canConfirmCancel(choices, 'cash'), false)
})

test('an invoice settled by a return cannot be cancelled', () => {
    const choices = settlementOptions(preview({ blocked_reason: 'return_offset' }))

    assert.equal(choices.blockedReason, 'return_offset')
    assert.equal(canConfirmCancel(choices, null), false)
})
