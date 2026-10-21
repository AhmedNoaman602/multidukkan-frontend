import { test } from 'node:test'
import assert from 'node:assert/strict'
import { codeBoxClass, codeInput, displayIdentifier, phoneInput } from './identifierInput.js'
import { formatIdentifier } from './formatCore.js'

// A stand-in for an <input>: just the parts the helpers use.
const fakeInput = (value, cursor = value.length) => ({
    value,
    selectionStart: cursor,
    selectionEnd: cursor,
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end },
})

test('small letters become capitals and the new value is returned', () => {
    const input = fakeInput('tn-1000a')
    assert.equal(codeInput(input, 'en'), 'TN-1000A')
    assert.equal(input.value, 'TN-1000A')
})

test('the cursor stays where the user is typing, not at the end', () => {
    const input = fakeInput('tn-1000', 2) // cursor right after "tn"
    codeInput(input, 'ar')
    assert.deepEqual([input.selectionStart, input.selectionEnd], [2, 2])
})

test('a selected range stays selected', () => {
    const input = { ...fakeInput('ab-cd'), selectionStart: 0, selectionEnd: 2 }
    codeInput(input, 'en')
    assert.deepEqual([input.selectionStart, input.selectionEnd], [0, 2])
})

test('Arabic digits are saved as Western digits and shown in the screen digits', () => {
    const arabicScreen = fakeInput('ab-١٢')
    assert.equal(codeInput(arabicScreen, 'ar'), 'AB-12')
    assert.equal(arabicScreen.value, 'AB-١٢')

    const englishScreen = fakeInput('ab-١٢')
    assert.equal(codeInput(englishScreen, 'en'), 'AB-12')
    assert.equal(englishScreen.value, 'AB-12')
})

test('Western digits typed on an Arabic screen are shown as Arabic digits', () => {
    const input = fakeInput('ab-12')
    assert.equal(codeInput(input, 'ar'), 'AB-12')
    assert.equal(input.value, 'AB-١٢')
})

test('Arabic letters are left as they are', () => {
    assert.equal(codeInput(fakeInput('مسمار-ab١٢'), 'ar'), 'مسمار-AB12')
})

test('a code copied from the screen pastes without its invisible marks, cursor at the end', () => {
    const pasted = formatIdentifier('2026-001', 'ar')
    const input = fakeInput(pasted)
    assert.equal(codeInput(input, 'ar'), '2026-001')
    assert.equal(input.value, '٢٠٢٦-٠٠١')
    assert.equal(input.selectionStart, input.value.length)
})

test('phones keep their letters and spacing, only the digits change', () => {
    const input = fakeInput('+٢٠ 10 1234')
    assert.equal(phoneInput(input, 'ar'), '+20 10 1234')
    assert.equal(input.value, '+٢٠ ١٠ ١٢٣٤')
})

test('an empty box stays empty', () => {
    assert.equal(codeInput(fakeInput(''), 'ar'), '')
    assert.equal(displayIdentifier(null, 'ar'), '')
})

test('the box value matches what typing produced, so React leaves the box alone', () => {
    const input = fakeInput('ab-12')
    const saved = codeInput(input, 'ar')
    assert.equal(displayIdentifier(saved, 'ar'), input.value)
})

test('only codes without Arabic letters get the left-to-right box rule', () => {
    assert.equal(codeBoxClass('AB-12-34'), '[unicode-bidi:bidi-override]')
    assert.equal(codeBoxClass(''), '[unicode-bidi:bidi-override]')
    assert.equal(codeBoxClass('مسمار-12'), '')
})
