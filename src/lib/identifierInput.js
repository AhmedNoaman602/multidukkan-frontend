// Code and phone boxes. They show and return Western digits on every screen (the owner's choice),
// so the same code is never stored two ways and search finds it; Arabic digits typed on an
// Arabic keyboard become Western as they are typed. The box's text is changed in place, before
// React sees it, which keeps the cursor where the user is typing; React then finds the same text
// and leaves the box alone, as long as the box's value prop goes through displayIdentifier().

import { toWesternDigits } from './number.js'

function typeInto(input, makePlain) {
    const { value, selectionStart, selectionEnd } = input
    const plain = makePlain(toWesternDigits(value))
    // Pasted direction marks are dropped, so a cursor after them moves back by that many.
    const at = (pos) => toWesternDigits(value.slice(0, pos)).length
    input.value = plain
    input.setSelectionRange(at(selectionStart), at(selectionEnd))
    return plain
}

// SKUs and customer and supplier codes, which are also kept in capitals.
export const codeInput = (input) => typeInto(input, (text) => text.toUpperCase())

export const phoneInput = (input) => typeInto(input, (text) => text)

// The box's value prop: the stored value as it is.
export const displayIdentifier = (value) => String(value ?? '')

// Inside a box, only CSS can keep the groups of a code like AB-12-34 in order on an Arabic
// screen. The same rule would also turn an Arabic word backwards, so a code holding Arabic
// letters is left to the browser. Phones have no letters and always use the rule.
const ARABIC_LETTER = /[ء-ي]/
export const codeBoxClass = (value) => (ARABIC_LETTER.test(value ?? '') ? '' : '[unicode-bidi:bidi-override]')
