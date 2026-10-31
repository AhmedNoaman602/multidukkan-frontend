// Search boxes ask the server as the user types: the pickers (/customers/lookup, /suppliers/lookup,
// a page at a time, MUL2-53) and the global search (/search).

export const LOOKUP_DELAY_MS = 250

// The page to ask for after `meta`, or undefined once the last page is loaded.
export function nextLookupPage(meta) {
    return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined
}

// Whether `searchedText` (the box text once typing paused) is still what the box holds, so its
// results may be shown. While the user is still typing, or the box is too short, nothing is.
export function isCurrentSearch(boxText, searchedText, minLength = 1) {
    const text = boxText.trim()
    return text.length >= minLength && text === searchedText
}

// React Query options for one searched text. Each text is its own query, so a reply that comes
// back late for an older text can only fill that text's entry, never the current one, and it
// can't touch the current query's loading state. The request gets React Query's AbortSignal, so
// it is cancelled once the box has moved on and nothing waits for it.
export function searchQueryOptions(key, text, fetchText, enabled) {
    return {
        queryKey: [...key, text],
        queryFn: ({ signal }) => fetchText(text, signal),
        enabled,
    }
}
