import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { isCurrentSearch, nextLookupPage, searchQueryOptions } from './lookup.js'

test('nextLookupPage asks for the next page until the last one', () => {
    assert.equal(nextLookupPage({ current_page: 1, last_page: 3 }), 2)
    assert.equal(nextLookupPage({ current_page: 3, last_page: 3 }), undefined)
    assert.equal(nextLookupPage({ current_page: 1, last_page: 1 }), undefined)
    assert.equal(nextLookupPage(undefined), undefined)
})

test('a search is current only while the box still holds that text', () => {
    assert.equal(isCurrentSearch('Has', 'Has'), true)
    assert.equal(isCurrentSearch('  Has ', 'Has'), true)
    assert.equal(isCurrentSearch('Hass', 'Has'), false)
    assert.equal(isCurrentSearch('', ''), false)
    assert.equal(isCurrentSearch('a', 'a', 2), false)
    assert.equal(isCurrentSearch('ab', 'ab', 2), true)
})

// A fake server whose replies are sent by hand, in any order. Like a server that never saw the
// cancel, it answers even after the request was aborted.
function fakeServer() {
    const requests = {}
    const fetchText = (text, signal) => new Promise(resolve => {
        requests[text] = { signal, reply: () => resolve({ data: [`results for ${text}`] }) }
    })
    return { requests, fetchText }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

// One search box: the observer moves from text to text the way the box does.
function searchBox(fetchText) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const options = (text, minLength = 1) => searchQueryOptions(['search'], text, fetchText, isCurrentSearch(text, text, minLength))
    const observer = new QueryObserver(client, options(''))
    const unsubscribe = observer.subscribe(() => {})
    return { type: text => observer.setOptions(options(text)), now: () => observer.getCurrentResult(), close: unsubscribe }
}

test('a late reply for an older text never replaces the newer results', async () => {
    const server = fakeServer()
    const box = searchBox(server.fetchText)

    box.type('Ahm')
    box.type('Ahmed')
    server.requests.Ahmed.reply()
    await settle()
    server.requests.Ahm.reply()
    await settle()

    assert.deepEqual(box.now().data, { data: ['results for Ahmed'] })
    assert.equal(box.now().isFetching, false)
    assert.equal(server.requests.Ahm.signal.aborted, true, 'the older request is cancelled')
    box.close()
})

test('a late reply for an older text cannot end the newer search\'s loading state', async () => {
    const server = fakeServer()
    const box = searchBox(server.fetchText)

    box.type('Ahm')
    box.type('Ahmed')
    server.requests.Ahm.reply()
    await settle()

    assert.equal(box.now().isFetching, true, 'still waiting for "Ahmed"')
    assert.equal(box.now().data, undefined)

    server.requests.Ahmed.reply()
    await settle()
    assert.deepEqual(box.now().data, { data: ['results for Ahmed'] })
    assert.equal(box.now().isFetching, false)
    box.close()
})

test('clearing the box clears the results, even if an older reply arrives afterwards', async () => {
    const server = fakeServer()
    const box = searchBox(server.fetchText)

    box.type('Ahm')
    box.type('')
    server.requests.Ahm.reply()
    await settle()

    assert.equal(box.now().data, undefined)
    assert.equal(box.now().isFetching, false)
    assert.equal(server.requests[''], undefined, 'an empty box sends no request')
    box.close()
})
