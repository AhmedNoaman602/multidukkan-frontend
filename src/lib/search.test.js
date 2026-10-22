import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchesSearch, normalizeSearchParams } from './search.js'
import { formatIdentifier } from './formatCore.js'

test('search and q params are sent with Western digits', () => {
    assert.deepEqual(normalizeSearchParams({ page: 2, search: 'INV-٢٠٢٦' }), { page: 2, search: 'INV-2026' })
    assert.deepEqual(normalizeSearchParams({ q: '٠١٠' }), { q: '010' })
})

test('other params and requests without params are left alone', () => {
    assert.deepEqual(normalizeSearchParams({ page: 2, store_id: 5 }), { page: 2, store_id: 5 })
    assert.equal(normalizeSearchParams(undefined), undefined)
})

test('the caller\'s params object is not changed', () => {
    const params = { search: '٢٠٢٦' }
    normalizeSearchParams(params)
    assert.equal(params.search, '٢٠٢٦')
})

test('matchesSearch finds Western data with Arabic or Persian digits typed', () => {
    assert.ok(matchesSearch('2026-001', '٢٠٢٦'))
    assert.ok(matchesSearch('01012345678', '۰۱۰'))
    assert.ok(matchesSearch('TN-1000', 'tn-١'))
})

test('matchesSearch finds an invoice number copied from the screen', () => {
    assert.ok(matchesSearch('2026-001', formatIdentifier('2026-001', 'ar')))
})

test('matchesSearch also finds data that was saved with Arabic digits', () => {
    assert.ok(matchesSearch('AB-١٢', 'ab-12'))
})

test('matchesSearch ignores letter case and handles missing values', () => {
    assert.ok(matchesSearch('Test Nails', 'nails'))
    assert.equal(matchesSearch(null, 'a'), false)
    assert.equal(matchesSearch('2026-001', '2027'), false)
})
