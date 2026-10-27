import { test } from 'node:test'
import assert from 'node:assert/strict'
import { codeBoxClass, codeInput, displayIdentifier, phoneInput } from './identifierInput.js'
import { formatCode } from './formatCore.js'

// A stand-in for an <input>: just the parts the helpers use.
const fakeInput = (value, cursor = value.length) => ({
    value,
    selectionStart: cursor,
    selectionEnd: cursor,
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end },
})

test('small letters become capitals and the new value is returned', () => {
    const input = fakeInput('tn-1000a')
    assert.equal(codeInput(input), 'TN-1000A')
    assert.equal(input.value, 'TN-1000A')
})

test('the cursor stays where the user is typing, not at the end', () => {
    const input = fakeInput('tn-1000', 2) // cursor right after "tn"
    codeInput(input)
    assert.deepEqual([input.selectionStart, input.selectionEnd], [2, 2])
})

test('a selected range stays selected', () => {
    const input = { ...fakeInput('ab-cd'), selectionStart: 0, selectionEnd: 2 }
    codeInput(input)
    assert.deepEqual([input.selectionStart, input.selectionEnd], [0, 2])
})

test('Arabic digits typed on an Arabic keyboard become Western digits in the box and when saved', () => {
    const input = fakeInput('ab-١٢')
    assert.equal(codeInput(input), 'AB-12')
    assert.equal(input.value, 'AB-12')
})

test('Western digits stay Western', () => {
    const input = fakeInput('ab-12')
    assert.equal(codeInput(input), 'AB-12')
    assert.equal(input.value, 'AB-12')
})

test('Arabic letters are left as they are', () => {
    assert.equal(codeInput(fakeInput('مسمار-ab١٢')), 'مسمار-AB12')
})

test('a code copied from an Arabic screen pastes without its invisible marks, cursor at the end', () => {
    const pasted = formatCode('TN-1000', 'ar')
    const input = fakeInput(pasted)
    assert.equal(codeInput(input), 'TN-1000')
    assert.equal(input.value, 'TN-1000')
    assert.equal(input.selectionStart, input.value.length)
})

test('phones keep their letters and spacing, only Arabic digits change', () => {
    const input = fakeInput('+٢٠ 10 ١٢٣٤')
    assert.equal(phoneInput(input), '+20 10 1234')
    assert.equal(input.value, '+20 10 1234')
})

test('an empty box stays empty', () => {
    assert.equal(codeInput(fakeInput('')), '')
    assert.equal(displayIdentifier(null), '')
})

test('the box value matches what typing produced, so React leaves the box alone', () => {
    const input = fakeInput('ab-١٢')
    const saved = codeInput(input)
    assert.equal(displayIdentifier(saved), input.value)
})

test('only codes without Arabic letters get the left-to-right box rule', () => {
    assert.equal(codeBoxClass('AB-12-34'), '[unicode-bidi:bidi-override]')
    assert.equal(codeBoxClass(''), '[unicode-bidi:bidi-override]')
    assert.equal(codeBoxClass('مسمار-12'), '')
})
