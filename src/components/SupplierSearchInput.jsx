import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '../i18n/useTranslation'
import { formatCode } from '../lib/format'
import { useLookupPages, useLookupSearch } from '../hooks/useLookup'

// Searches /suppliers/lookup on the server. `selected` is the chosen supplier object; onSelect
// receives a supplier, or null when the choice is cleared. `excludeIds` hides suppliers already picked.
export default function SupplierSearchInput({ selected, onSelect, excludeIds = [], placeholder, autoFocus = false }) {
    const { t } = useTranslation()
    const effectivePlaceholder = placeholder ?? t('search.supplier.placeholder')
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(0)
    const [browseOpen, setBrowseOpen] = useState(false)
    const [browseQuery, setBrowseQuery] = useState('')
    const ref = useRef(null)

    const notExcluded = s => !excludeIds.includes(s.id)
    const search = useLookupSearch('/suppliers/lookup', query)
    const filtered = search.results.filter(notExcluded).slice(0, 8)
    const browse = useLookupPages('/suppliers/lookup', browseQuery, browseOpen)
    const browseItems = browse.items.filter(notExcluded)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (browseOpen) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [browseOpen])

    const handleSelect = (supplier) => {
        onSelect(supplier)
        setQuery('')
        setOpen(false)
        setHighlighted(0)
    }

    const handleBrowseSelect = (supplier) => {
        onSelect(supplier)
        setBrowseOpen(false)
        setBrowseQuery('')
    }

    const handleClear = () => {
        onSelect(null)
        setQuery('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setHighlighted(h => Math.min(h + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted(h => Math.max(h - 1, 0))
        } else if (e.key === 'Enter' && open && filtered.length > 0) {
            e.preventDefault()
            handleSelect(filtered[Math.min(highlighted, filtered.length - 1)])
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    if (selected) {
        return (
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                        <span className="text-purple-400 text-xs font-bold">{selected.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="text-white text-sm font-medium">{selected.name}</span>
                        <span className="text-gray-400 text-sm ms-2">{formatCode(selected.phone)}</span>
                        {selected.code && (
                            <span className="text-gray-500 text-xs ms-2">{formatCode(selected.code)}</span>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-gray-500 hover:text-red-400 transition-colors text-sm ms-3 shrink-0"
                >
                    ✕
                </button>
            </div>
        )
    }

    const dropdownMessage = search.failed
        ? t('search.failed')
        : search.searching
            ? t('search.searching')
            : query.trim().length > 0 && filtered.length === 0
                ? t('search.supplier.noResults', { query })
                : null

    return (
        <>
            <div className="flex gap-2">
                <div ref={ref} className="relative flex-1">
                    <input
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(0) }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query && setOpen(true)}
                        placeholder={effectivePlaceholder}
                        autoComplete="off"
                        autoFocus={autoFocus}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    />

                    {open && filtered.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                            {filtered.map((supplier, i) => (
                                <div
                                    key={supplier.id}
                                    onMouseDown={() => handleSelect(supplier)}
                                    className={`px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                                        i === highlighted ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{supplier.name}</span>
                                        <span className={`text-xs ${i === highlighted ? 'text-blue-200' : 'text-gray-400'}`}>{formatCode(supplier.phone)}</span>
                                    </div>
                                    {supplier.code && (
                                        <div className={`text-xs mt-0.5 ${i === highlighted ? 'text-blue-200' : 'text-gray-500'}`}>{formatCode(supplier.code)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {open && filtered.length === 0 && dropdownMessage && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-3 py-3 text-gray-400 text-sm">
                            {dropdownMessage}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setBrowseOpen(true)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-sm rounded-lg transition-colors whitespace-nowrap"
                >
                    {t('search.browse')}
                </button>
            </div>

            {browseOpen && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={() => { setBrowseOpen(false); setBrowseQuery('') }}
                >
                    <div
                        className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg flex flex-col max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h3 className="text-white font-semibold">{t('search.supplier.browseTitle')}</h3>
                            <button
                                type="button"
                                onClick={() => { setBrowseOpen(false); setBrowseQuery('') }}
                                className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-800">
                            <input
                                type="text"
                                value={browseQuery}
                                onChange={e => setBrowseQuery(e.target.value)}
                                placeholder={t('search.supplier.placeholder')}
                                autoFocus
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-2">
                                {browse.total !== undefined ? t('search.supplier.countLabel', { count: browse.total }) : t('search.searching')}
                            </p>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {browseItems.map(supplier => (
                                <div
                                    key={supplier.id}
                                    onClick={() => handleBrowseSelect(supplier)}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                                            <span className="text-purple-400 text-xs font-bold">{supplier.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{supplier.name}</p>
                                            {supplier.code && (
                                                <p className="text-gray-500 text-xs mt-0.5">{formatCode(supplier.code)}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm">{formatCode(supplier.phone)}</p>
                                </div>
                            ))}
                            {browse.hasMore && (
                                <button
                                    type="button"
                                    onClick={() => browse.loadMore()}
                                    disabled={browse.loadingMore}
                                    className="w-full py-3 text-sm text-blue-400 hover:bg-gray-800 transition-colors disabled:text-gray-500"
                                >
                                    {browse.loadingMore ? t('search.searching') : t('search.showMore')}
                                </button>
                            )}
                            {browse.failed && (
                                <div className="text-center py-12 text-gray-500 text-sm">{t('search.failed')}</div>
                            )}
                            {!browse.failed && !browse.searching && browseItems.length === 0 && !browse.hasMore && (
                                <div className="text-center py-12 text-gray-500 text-sm">{t('search.supplier.noResultsBrowse')}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
