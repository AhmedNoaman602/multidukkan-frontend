import { test } from 'node:test'
import assert from 'node:assert/strict'
import { upperCaseInput } from './upperCaseInput.js'

// A stand-in for an <input>: just the parts upperCaseInput uses.
const fakeInput = (value, cursor = value.length) => ({
    value,
    selectionStart: cursor,
    selectionEnd: cursor,
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end },
})

test('small letters become capitals and the new value is returned', () => {
    const input = fakeInput('tn-1000a')
    assert.equal(upperCaseInput(input), 'TN-1000A')
    assert.equal(input.value, 'TN-1000A')
})

test('the cursor stays where the user is typing, not at the end', () => {
    const input = fakeInput('tn-1000', 2) // cursor right after "tn"
    upperCaseInput(input)
    assert.equal(input.selectionStart, 2)
    assert.equal(input.selectionEnd, 2)
})

test('a selected range stays selected', () => {
    const input = { ...fakeInput('ab-cd'), selectionStart: 0, selectionEnd: 2 }
    upperCaseInput(input)
    assert.deepEqual([input.selectionStart, input.selectionEnd], [0, 2])
})

test('Arabic letters and digits are left as they are', () => {
    assert.equal(upperCaseInput(fakeInput('مسمار-ab١٢')), 'مسمار-AB١٢')
})

test('an empty box stays empty', () => {
    assert.equal(upperCaseInput(fakeInput('')), '')
})
