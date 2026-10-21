import { test } from 'node:test'
import assert from 'node:assert/strict'
import { interpolate } from './interpolate.js'
import { toDisplayDigits } from '../lib/formatCore.js'

test('number values get Arabic digits in Arabic and stay Western in English', () => {
    assert.equal(interpolate('الأصناف: {count}', { count: 1 }, 'ar'), 'الأصناف: ١')
    assert.equal(interpolate('صفحة {page} من {total}', { page: 2, total: 12 }, 'ar'), 'صفحة ٢ من ١٢')
    assert.equal(interpolate('Items: {count}', { count: 1 }, 'en'), 'Items: 1')
})

test('large numbers get the thousands mark of the language', () => {
    assert.equal(interpolate('{count}', { count: 1250 }, 'ar'), '١٬٢٥٠')
    assert.equal(interpolate('{count}', { count: 1250 }, 'en'), '1,250')
})

test('string values pass through untouched, even when they hold digits', () => {
    assert.equal(interpolate('{sku}', { sku: 'HAM-001' }, 'ar'), 'HAM-001')
    assert.equal(interpolate('{name}', { name: 'Pepsi 1L' }, 'ar'), 'Pepsi 1L')
    assert.equal(interpolate('{amount}', { amount: '٤٨٫٠٠ ج.م' }, 'ar'), '٤٨٫٠٠ ج.م')
})

test('a year passed through toDisplayDigits has no thousands mark', () => {
    assert.equal(interpolate('© {year}', { year: toDisplayDigits(2026, 'ar') }, 'ar'), '© ٢٠٢٦')
    assert.equal(interpolate('© {year}', { year: toDisplayDigits(2026, 'en') }, 'en'), '© 2026')
})

test('zero is a value, and missing placeholders stay visible', () => {
    assert.equal(interpolate('{count}', { count: 0 }, 'ar'), '٠')
    assert.equal(interpolate('{count} {other}', { count: 3 }, 'ar'), '٣ {other}')
    assert.equal(interpolate('no params', undefined, 'ar'), 'no params')
})
