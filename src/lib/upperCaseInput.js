// Codes (SKU, customer and supplier codes) are typed in capitals. Changing the box's text in
// place, before React sees it, keeps the cursor where the user is typing.
export function upperCaseInput(input) {
    const { selectionStart, selectionEnd } = input
    input.value = input.value.toUpperCase()
    input.setSelectionRange(selectionStart, selectionEnd)
    return input.value
}
