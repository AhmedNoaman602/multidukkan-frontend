import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '../i18n/useTranslation'
import { formatNumber } from '../lib/format'

export default function ProductSearchInput({ products, onSelect, showCostPrice = false, placeholder, inputRef: externalRef, disabled = false }) {
    const { t } = useTranslation()
    const effectivePlaceholder = placeholder ?? t('search.product.placeholder')
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(0)
    const [browseOpen, setBrowseOpen] = useState(false)
    const [browseQuery, setBrowseQuery] = useState('')
    const ref = useRef(null)
    const internalInputRef = useRef(null)
    const inputRefToUse = externalRef || internalInputRef

    const filtered = query.length > 0
        ? products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(query.toLowerCase()))
          ).slice(0, 8)
        : []

    const browseFiltered = browseQuery.length > 0
        ? products.filter(p =>
            p.name.toLowerCase().includes(browseQuery.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(browseQuery.toLowerCase()))
          )
        : products

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

    const handleSelect = (product) => {
        onSelect(product)
        setQuery('')
        setOpen(false)
        setHighlighted(0)
    }

    const handleBrowseSelect = (product) => {
        onSelect(product)
        setBrowseOpen(false)
        setBrowseQuery('')
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
            handleSelect(filtered[highlighted])
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    // Expose focus method

    return (
        <>
            <div className="flex gap-2">
                <div ref={ref} className="relative flex-1">
                    <input
                        ref={inputRefToUse}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(0) }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => query && setOpen(true)}
                        placeholder={effectivePlaceholder}
                        autoComplete="off"
                        disabled={disabled}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />

                    {open && filtered.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                            {filtered.map((product, i) => (
                                <div
                                    key={product.id}
                                    onMouseDown={() => handleSelect(product)}
                                    className={`px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                                        i === highlighted ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{product.name}</span>
                                        <span className={`text-xs ${i === highlighted ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {formatNumber(showCostPrice ? (product.cost_price ?? product.price) : product.price)} {t('common.currency')}
                                        </span>
                                    </div>
                                    {product.sku && (
                                        <div className={`text-xs mt-0.5 ${i === highlighted ? 'text-blue-200' : 'text-gray-500'}`}>
                                            {t('search.product.skuLabel', { sku: product.sku })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {open && query.length > 0 && filtered.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-3 py-3 text-gray-400 text-sm">
                            {t('search.product.noResults', { query })}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setBrowseOpen(true)}
                    disabled={disabled}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-sm rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
                >
                    {t('search.browse')}
                </button>
            </div>

            {/* Browse All Modal */}
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
                            <h3 className="text-white font-semibold">{t('search.product.browseTitle')}</h3>
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
                                placeholder={t('search.product.placeholder')}
                                autoFocus
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-2">
                                {t('search.product.countLabel', { count: browseFiltered.length })}
                            </p>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {browseFiltered.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => handleBrowseSelect(product)}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800/50"
                                >
                                    <div>
                                        <p className="text-white text-sm font-medium">{product.name}</p>
                                        {product.sku && (
                                            <p className="text-gray-500 text-xs mt-0.5">{t('search.product.skuLabel', { sku: product.sku })}</p>
                                        )}
                                    </div>
                                    <div className="text-end">
<p className="text-white text-sm font-medium">
    {formatNumber(showCostPrice ? (product.cost_price ?? product.price) : product.price)} {t('common.currency')}
</p>                                        <p className="text-gray-500 text-xs">{product.unit}</p>
                                    </div>
                                </div>
                            ))}
                            {browseFiltered.length === 0 && (
                                <div className="text-center py-12 text-gray-500 text-sm">{t('search.product.noResultsBrowse')}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}