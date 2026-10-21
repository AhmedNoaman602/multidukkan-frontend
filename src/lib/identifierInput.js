// Code and phone boxes. The box shows the screen's digits (AB-١٢ on Arabic screens) while the
// value returned for saving always has Western digits (AB-12), so the same code is never stored
// two ways and search finds it. The box's text is changed in place, before React sees it, which
// keeps the cursor where the user is typing; React then finds the same text and leaves the box
// alone, as long as the box's value prop goes through displayIdentifier().

import { getDisplayLanguage, toDisplayDigits } from './formatCore.js'
import { toWesternDigits } from './number.js'

function typeInto(input, makePlain, lang) {
    const { value, selectionStart, selectionEnd } = input
    const plain = makePlain(toWesternDigits(value))
    // Pasted direction marks are dropped, so a cursor after them moves back by that many.
    const at = (pos) => toWesternDigits(value.slice(0, pos)).length
    input.value = toDisplayDigits(plain, lang)
    input.setSelectionRange(at(selectionStart), at(selectionEnd))
    return plain
}

// SKUs and customer and supplier codes, which are also kept in capitals.
export const codeInput = (input, lang = getDisplayLanguage()) =>
    typeInto(input, (text) => text.toUpperCase(), lang)

export const phoneInput = (input, lang = getDisplayLanguage()) => typeInto(input, (text) => text, lang)

// The box's value prop: the stored value with the screen's digits.
export const displayIdentifier = (value, lang = getDisplayLanguage()) => toDisplayDigits(value ?? '', lang)

// Inside a box, only CSS can keep digit groups in order (AB-١٢-٣٤ would show as AB-٣٤-١٢). The
// same rule would also turn an Arabic word backwards, so a code holding Arabic letters is left to
// the browser. Phones have no letters and always use the rule.
const ARABIC_LETTER = /[ء-ي]/
export const codeBoxClass = (value) => (ARABIC_LETTER.test(value ?? '') ? '' : '[unicode-bidi:bidi-override]')
