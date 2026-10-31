import { useEffect, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { LOOKUP_DELAY_MS, isCurrentSearch, nextLookupPage, searchQueryOptions } from '../lib/lookup'

// The box text once typing pauses, so a request isn't sent for every key.
function useSettledText(text, delay) {
    const [settled, setSettled] = useState(text)
    useEffect(() => {
        const timer = setTimeout(() => setSettled(text), delay)
        return () => clearTimeout(timer)
    }, [text, delay])
    return settled
}

// A search box backed by the server. Only the latest settled text can fill the results or the
// loading state; clearing the box (or going under minLength) shows nothing.
export function useServerSearch(key, boxText, fetchText, { minLength = 1, delay = LOOKUP_DELAY_MS } = {}) {
    const text = boxText.trim()
    const searched = useSettledText(text, delay)
    const active = text.length >= minLength
    const current = isCurrentSearch(boxText, searched, minLength)
    const { data, isFetching, isError } = useQuery(searchQueryOptions(key, searched, fetchText, current))
    return {
        data: current ? data : undefined,
        searching: active && (!current || (isFetching && !data)),
        failed: current && isError,
    }
}

// '/customers/lookup' → ['customers', 'lookup', …], so refreshing ['customers'] refreshes lookups too.
const lookupKey = (path, ...rest) => [path.split('/')[1], 'lookup', ...rest]

const fetchPage = (path, search, page, signal) =>
    api.get(path, { params: { search: search || undefined, page }, signal }).then(res => res.data)

// A picker's dropdown: the first page of matches for the box text.
export function useLookupSearch(path, boxText) {
    const search = useServerSearch(lookupKey(path, 1), boxText, (text, signal) => fetchPage(path, text, 1, signal))
    return { ...search, results: search.data?.data ?? [] }
}

// A browse window: every match, a page at a time.
export function useLookupPages(path, boxText, enabled) {
    const text = boxText.trim()
    const searched = useSettledText(text, LOOKUP_DELAY_MS)
    const current = searched === text
    const query = useInfiniteQuery({
        queryKey: lookupKey(path, 'pages', searched),
        queryFn: ({ pageParam, signal }) => fetchPage(path, searched, pageParam, signal),
        initialPageParam: 1,
        getNextPageParam: last => nextLookupPage(last.meta),
        enabled: enabled && current,
    })
    const pages = current ? query.data?.pages ?? [] : []
    return {
        items: pages.flatMap(page => page.data),
        total: pages[0]?.meta.total,
        searching: !current || (query.isFetching && !query.isFetchingNextPage && pages.length === 0),
        failed: current && query.isError,
        hasMore: current && query.hasNextPage,
        loadingMore: query.isFetchingNextPage,
        loadMore: query.fetchNextPage,
    }
}

// How many records the lookup holds in total (meta.total of the first page).
export function useLookupTotal(path, enabled = true) {
    const { data } = useQuery({
        queryKey: lookupKey(path, 1, ''),
        queryFn: ({ signal }) => fetchPage(path, '', 1, signal),
        enabled,
    })
    return data?.meta.total
}
