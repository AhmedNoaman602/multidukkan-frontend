import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
    formatDate,
    formatIdentifier,
    formatNumber,
    formatPercent,
    formatUnitBreakdown,
    setDisplayLanguage,
    toDisplayDigits,
} from './formatCore.js'

const MONEY = { minimumFractionDigits: 2, maximumFractionDigits: 2 }
const WESTERN_DIGIT = /[0-9]/

test('Arabic shows Arabic digits with the Arabic thousands and decimal marks', () => {
    assert.equal(formatNumber(1250.5, MONEY, 'ar'), '١٬٢٥٠٫٥٠')
    assert.equal(formatNumber(48.5, MONEY, 'ar'), '٤٨٫٥٠')
    assert.equal(formatNumber(3, {}, 'ar'), '٣')
})

test('English is unchanged: Western digits, comma and dot', () => {
    assert.equal(formatNumber(1250.5, MONEY, 'en'), '1,250.50')
    assert.equal(formatNumber(3, {}, 'en'), '3')
})

test('without an explicit language, numbers follow the current display language', () => {
    setDisplayLanguage('ar')
    assert.equal(formatNumber(12), '١٢')
    setDisplayLanguage('en')
    assert.equal(formatNumber(12), '12')
    setDisplayLanguage('ar')
})

test('an unknown language falls back to English formatting', () => {
    assert.equal(formatNumber(12, {}, 'fr'), '12')
})

test('not-a-number still shows a dash in both languages', () => {
    assert.equal(formatNumber('abc', {}, 'ar'), '—')
    assert.equal(formatNumber(undefined, {}, 'en'), '—')
})

test('dates use Arabic digits in Arabic and stay dd/mm/yyyy in English', () => {
    const day = new Date(2026, 9, 17)
    const arabic = formatDate(day, 'ar')
    assert.ok(arabic.includes('١٧') && arabic.includes('١٠') && arabic.includes('٢٠٢٦'), arabic)
    assert.ok(!WESTERN_DIGIT.test(arabic), arabic)
    assert.equal(formatDate(day, 'en'), '17/10/2026')
})

test('the unit breakdown follows the display language', () => {
    setDisplayLanguage('ar')
    const product = { unit: 'قطعة', secondary_unit: 'علبة', conversion_factor: 12 }
    assert.equal(formatUnitBreakdown(44, product), '٤٤ قطعة (٣ علبة + ٨ قطعة)')
    setDisplayLanguage('en')
    assert.equal(formatUnitBreakdown(44, { unit: 'pcs', secondary_unit: 'box', conversion_factor: 12 }), '44 pcs (3 box + 8 pcs)')
    setDisplayLanguage('ar')
})

test('toDisplayDigits converts only the digits of identifiers like invoice numbers, SKUs and phones', () => {
    assert.equal(toDisplayDigits('2026-001', 'ar'), '٢٠٢٦-٠٠١')
    assert.equal(toDisplayDigits('TN-1000', 'ar'), 'TN-١٠٠٠')
    assert.equal(toDisplayDigits('01012345678', 'ar'), '٠١٠١٢٣٤٥٦٧٨')
    assert.equal(toDisplayDigits('2026-001', 'en'), '2026-001')
})

test('toDisplayDigits accepts numbers and leaves empty values empty', () => {
    assert.equal(toDisplayDigits(42, 'ar'), '٤٢')
    assert.equal(toDisplayDigits(null, 'ar'), '')
    assert.equal(toDisplayDigits(undefined, 'ar'), '')
})

const START = '\u2066\u202D'
const END = '\u202C\u2069'

test('formatIdentifier gives Arabic digits kept left to right in Arabic', () => {
    assert.equal(formatIdentifier('2026-001', 'ar'), `${START}٢٠٢٦-٠٠١${END}`)
    assert.equal(formatIdentifier('TN-1000', 'ar'), `${START}TN-١٠٠٠${END}`)
    assert.equal(formatIdentifier('#12', 'ar'), `${START}#١٢${END}`)
})

test('formatIdentifier leaves English exactly as it was, and empty values empty', () => {
    assert.equal(formatIdentifier('2026-001', 'en'), '2026-001')
    assert.equal(formatIdentifier(null, 'ar'), '')
    assert.equal(formatIdentifier(undefined, 'ar'), '')
    assert.equal(formatIdentifier('', 'ar'), '')
})

test('formatPercent uses the Arabic percent sign in Arabic', () => {
    assert.ok(formatPercent(40, 'ar').startsWith('٤٠٪'), formatPercent(40, 'ar'))
    assert.ok(formatPercent(33.33, 'ar').startsWith('٣٣٫٣٣٪'), formatPercent(33.33, 'ar'))
    assert.equal(formatPercent(40, 'en'), '40%')
    assert.equal(formatPercent('12.5', 'en'), '12.5%')
    assert.equal(formatPercent(33.333, 'en', 1), '33.3%')
})

test('formatPercent shows a dash for missing values instead of 0%', () => {
    assert.equal(formatPercent(null, 'ar'), '—')
    assert.equal(formatPercent(undefined, 'en'), '—')
    assert.equal(formatPercent('abc', 'en'), '—')
})
