import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeNumberText, parseNumber } from './number.js'

// norm() is the final parse; typed() is a field being edited.
const norm = (raw, decimals = 2) => normalizeNumberText(raw, { decimals })
const typed = (raw, decimals = 2) => normalizeNumberText(raw, { decimals, typing: true })

test('Western digits pass through unchanged', () => {
    assert.deepEqual(norm('123'), { text: '123', error: null })
    assert.deepEqual(norm('123.45'), { text: '123.45', error: null })
})

test('Arabic-Indic digits become Western digits', () => {
    assert.deepEqual(norm('١٢٣'), { text: '123', error: null })
    assert.deepEqual(norm('٠١٢٣٤٥٦٧٨٩', 0), { text: '0123456789', error: null })
})

test('Persian digits become Western digits', () => {
    assert.deepEqual(norm('۱۲۳'), { text: '123', error: null })
    assert.deepEqual(norm('۰۱۲۳۴۵۶۷۸۹', 0), { text: '0123456789', error: null })
})

test('Arabic and Persian decimals normalize the same while typing and on submit', () => {
    for (const parse of [norm, typed]) {
        assert.deepEqual(parse('١٢٣٫٤٥'), { text: '123.45', error: null })
        assert.deepEqual(parse('۱۲۳٫۴۵'), { text: '123.45', error: null })
        assert.deepEqual(parse('12٫5'), { text: '12.5', error: null })
        assert.deepEqual(parse('١٢٣.٤٥'), { text: '123.45', error: null })
        assert.deepEqual(parse('٫٥'), { text: '0.5', error: null })
    }
    assert.equal(parseNumber('١٢٣٫٤٥'), 123.45)
    assert.equal(parseNumber('۱۲۳٫۴۵'), 123.45)
})

test('a plain or Arabic comma is rejected, never guessed', () => {
    for (const parse of [norm, typed]) {
        assert.equal(parse('12,5').error, 'comma')
        assert.equal(parse('1,234.50').error, 'comma')
        assert.equal(parse('12،5').error, 'comma')
    }
    assert.ok(Number.isNaN(parseNumber('12,5')))
})

test('a space inside a number is rejected, never joined: "12 5" is not 125', () => {
    for (const parse of [norm, typed]) {
        assert.equal(parse('12 5').error, 'spaces')
        assert.equal(parse('١٢ ٥').error, 'spaces')
        assert.equal(parse('12 5').error, 'spaces')   // no-break space
        assert.equal(parse('12 5').error, 'spaces')   // thin space
        assert.equal(parse('1 234.50').error, 'spaces')
    }
    assert.ok(Number.isNaN(parseNumber('12 5')))
})

test('while typing, a trailing or leading space is an error so the next digit cannot join on', () => {
    assert.equal(typed('12 ').error, 'spaces')
    assert.equal(typed(' 12').error, 'spaces')
})

test('on submit, surrounding spaces are trimmed', () => {
    assert.deepEqual(norm(' 12.5 '), { text: '12.5', error: null })
    assert.deepEqual(norm(' ١٢ '), { text: '12', error: null })
    assert.equal(parseNumber('  150 '), 150)
})

test('direction marks from pasted RTL text are stripped wherever they are', () => {
    for (const parse of [norm, typed]) {
        assert.deepEqual(parse('‏١٢٣‎'), { text: '123', error: null })
        assert.deepEqual(parse('12؜.5'), { text: '12.5', error: null })
    }
})

test('a lone decimal point is never a number: incomplete while typing, invalid on submit', () => {
    assert.deepEqual(typed('.'), { text: null, error: 'incomplete' })
    assert.deepEqual(typed('٫'), { text: null, error: 'incomplete' })
    assert.deepEqual(norm('.'), { text: null, error: 'invalid' })
    assert.ok(Number.isNaN(parseNumber('.')))
    assert.ok(Number.isNaN(parseNumber('٫')))
    assert.ok(Number.isNaN(parseNumber(' . ')))
})

test('a trailing decimal point with digits is a valid partial value', () => {
    assert.deepEqual(typed('12.'), { text: '12.', error: null })
    assert.equal(parseNumber('12.'), 12)
})

test('the Arabic thousands separator is accepted only in correct groups of three', () => {
    assert.deepEqual(norm('١٬٢٣٤٫٥٠'), { text: '1234.50', error: null })
    assert.deepEqual(norm('1٬234٬567', 0), { text: '1234567', error: null })
    assert.equal(norm('12٬5').error, 'thousands')
    assert.equal(norm('1٬2345').error, 'thousands')
    assert.equal(norm('1٬').error, 'thousands')
})

test('empty means no value: null, not zero', () => {
    assert.deepEqual(norm(''), { text: '', error: null })
    assert.deepEqual(norm(null), { text: '', error: null })
    assert.deepEqual(norm('   '), { text: '', error: null })
    assert.equal(parseNumber(''), null)
    assert.equal(parseNumber(undefined), null)
    assert.equal(parseNumber('  '), null)
})

test('invalid input is rejected and parses to NaN, never zero', () => {
    for (const bad of ['abc', '12a', '1e3', '+5', '1.2.3', '١٢x']) {
        assert.equal(norm(bad).error, 'invalid', bad)
        assert.ok(Number.isNaN(parseNumber(bad)), bad)
    }
})

test('negative numbers are rejected: no field using this parser accepts them', () => {
    for (const parse of [norm, typed]) {
        assert.equal(parse('-5').error, 'invalid')
        assert.equal(parse('-١٢٫٥').error, 'invalid')
    }
    assert.ok(Number.isNaN(parseNumber('-5')))
})

test('money fields allow two decimals and no more', () => {
    assert.deepEqual(norm('123.45', 2), { text: '123.45', error: null })
    assert.deepEqual(norm('٠٫٠٥', 2), { text: '0.05', error: null })
    assert.equal(norm('123.456', 2).error, 'decimals')
    assert.equal(norm('123.4567', 2).error, 'decimals')
    assert.equal(norm('١٢٣٫٤٥٦', 2).error, 'decimals')
})

test('count fields (quantities, factors, thresholds) allow whole numbers only', () => {
    assert.deepEqual(norm('12', 0), { text: '12', error: null })
    assert.deepEqual(norm('١٢', 0), { text: '12', error: null })
    assert.equal(norm('1.5', 0).error, 'integer')
    assert.equal(norm('12.', 0).error, 'integer')
    assert.equal(norm('١٫٥', 0).error, 'integer')
})

test('parseNumber returns the numeric value', () => {
    assert.equal(parseNumber('0'), 0)
    assert.equal(parseNumber('150.00'), 150)
})
