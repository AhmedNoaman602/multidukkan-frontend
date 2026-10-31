import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import { formatCode, formatCurrency, formatIdentifier, formatPrice } from '../lib/format'
import { useServerSearch } from '../hooks/useLookup'

const fetchSearch = (text, signal) => api.get('/search', { params: { q: text }, signal }).then(res => res.data)

export default function GlobalSearch({ open, onClose }) {
    const [query, setQuery] = useState('')
    const [highlighted, setHighlighted] = useState(0)
    const inputRef = useRef(null)
    const navigate = useNavigate()
    const { t, lang } = useTranslation()

    // Only the latest query can fill the results or the loading state (failures stay silent).
    const search = useServerSearch(['search'], query, fetchSearch, { minLength: 2, delay: 200 })
    const loading = search.searching
    const results = {
        customers:      search.data?.customers ?? [],
        products:       search.data?.products ?? [],
        orders:         search.data?.orders ?? [],
        suppliers:      search.data?.suppliers ?? [],
        purchaseOrders: search.data?.purchase_orders ?? [],
    }

    // Each opening starts with an empty box.
    const [wasOpen, setWasOpen] = useState(open)
    if (open !== wasOpen) {
        setWasOpen(open)
        if (open) {
            setQuery('')
            setHighlighted(0)
        }
    }

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    // Flatten all results into one list for keyboard navigation
    const flatResults = [
        ...results.customers.map(c => ({ type: 'customer', item: c, path: `/customers/${c.id}/balance`, label: c.name, sub: `${formatCode(c.code)} · ${formatCode(c.phone)}` })),
        ...results.products.map(p => ({ type: 'product', item: p, path: `/products/${p.id}`, label: p.name, sub: `${t('search.product.skuLabel', { sku: formatCode(p.sku) })} · ${formatPrice(p.price, lang)}` })),
        ...results.orders.map(o => ({ type: 'order', item: o, path: `/orders/${o.id}`, label: formatIdentifier(o.invoice_number), sub: `${o.customer_name} · ${formatCurrency(o.total, lang)}`, status: o.status })),
        ...results.suppliers.map(s => ({ type: 'supplier', item: s, path: `/suppliers/${s.id}/balance`, label: s.name, sub: `${formatCode(s.code)} · ${formatCode(s.phone)}` })),
        ...results.purchaseOrders.map(po => ({ type: 'purchaseOrder', item: po, path: `/purchase-orders/${po.id}`, label: formatIdentifier(po.invoice_number), sub: `${po.supplier_name} · ${formatCurrency(po.total, lang)}`, status: po.status })),
    ]

    const handleSelect = (path) => {
        navigate(path)
        onClose()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') { onClose(); return }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlighted(h => Math.min(h + 1, flatResults.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted(h => Math.max(h - 1, 0))
        } else if (e.key === 'Enter' && flatResults.length > 0) {
            e.preventDefault()
            handleSelect(flatResults[highlighted].path)
        }
    }

    const hasResults = flatResults.length > 0

    const sectionLabel = {
        customer:      t('customers.title'),
        product:       t('products.title'),
        order:         t('orders.title'),
        supplier:      t('suppliers.title'),
        purchaseOrder: t('purchaseOrders.title'),
    }

    const sectionIcon = {
        customer:      '👤',
        product:       '📦',
        order:         '🧾',
        supplier:      '🏭',
        purchaseOrder: '🛒',
    }

    if (!open) return null

    // Group flat results by type for display
    const grouped = flatResults.reduce((acc, r, i) => {
        if (!acc[r.type]) acc[r.type] = []
        acc[r.type].push({ ...r, flatIndex: i })
        return acc
    }, {})

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-24 px-4"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xl shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                    <span className="text-gray-400 text-lg">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setHighlighted(0) }}
                        onKeyDown={handleKeyDown}
                        placeholder={t('search.global.placeholder')}
                        className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
                    />
                    {loading && <span className="text-gray-500 text-xs">{t('search.global.searching')}</span>}
                    <kbd className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700">Esc</kbd>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {/* Empty state */}
                    {!query && (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            {t('search.global.emptyHint')}
                            <div className="mt-3 flex justify-center gap-4 text-xs text-gray-600">
                                <span>{t('search.global.navigateHint')}</span>
                                <span>{t('search.global.selectHint')}</span>
                                <span>{t('search.global.closeHint')}</span>
                            </div>
                        </div>
                    )}

                    {/* No results */}
                    {query.length >= 2 && !loading && !hasResults && (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            {t('search.global.noResultsFor', { query })}
                        </div>
                    )}

                    {/* Grouped results */}
                    {Object.entries(grouped).map(([type, items]) => (
                        <div key={type}>
                            <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider bg-gray-800/50 flex items-center gap-2">
                                <span>{sectionIcon[type]}</span>
                                <span>{sectionLabel[type]}</span>
                            </div>
                            {items.map((r) => (
                                <div
                                    key={`${r.type}-${r.item.id}`}
                                    onClick={() => handleSelect(r.path)}
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-gray-800/50 ${
                                        r.flatIndex === highlighted
                                            ? 'bg-blue-600/20 border-s-2 border-s-blue-500'
                                            : 'hover:bg-gray-800'
                                    }`}
                                >
                                    <div>
                                        <p className="text-white text-sm font-medium">{r.label}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{r.sub}</p>
                                    </div>
                                    {r.status && (
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            r.status === 'paid'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {t(`enums.orderStatus.${r.status}`)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
