import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function GlobalSearch({ open, onClose }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState({ customers: [], products: [], orders: [], suppliers: [], purchaseOrders: [] })
    const [loading, setLoading] = useState(false)
    const [highlighted, setHighlighted] = useState(0)
    const inputRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (open) {
            setQuery('')
            setResults({ customers: [], products: [], orders: [], suppliers: [], purchaseOrders: [] })
            setHighlighted(0)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults({ customers: [], products: [], orders: [], suppliers: [], purchaseOrders: [] })
            return
        }

        const timeout = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await api.get(`/search?q=${query}`)
                setResults({
                    customers:      res.data.customers ?? [],
                    products:       res.data.products ?? [],
                    orders:         res.data.orders ?? [],
                    suppliers:      res.data.suppliers ?? [],
                    purchaseOrders: res.data.purchase_orders ?? [],
                })
                setHighlighted(0)
            } catch {
                // fail silently
            } finally {
                setLoading(false)
            }
        }, 200)

        return () => clearTimeout(timeout)
    }, [query])

    // Flatten all results into one list for keyboard navigation
    const flatResults = [
        ...results.customers.map(c => ({ type: 'customer', item: c, path: `/customers/${c.id}/balance`, label: c.name, sub: `${c.code} · ${c.phone}` })),
        ...results.products.map(p => ({ type: 'product', item: p, path: `/products/${p.id}`, label: p.name, sub: `SKU: ${p.sku} · ${p.price} EGP` })),
        ...results.orders.map(o => ({ type: 'order', item: o, path: `/orders/${o.id}`, label: o.invoice_number, sub: `${o.customer_name} · ${o.total} EGP` })),
        ...results.suppliers.map(s => ({ type: 'supplier', item: s, path: `/suppliers/${s.id}/balance`, label: s.name, sub: `${s.code} · ${s.phone}` })),
        ...results.purchaseOrders.map(po => ({ type: 'purchaseOrder', item: po, path: `/purchase-orders/${po.id}`, label: po.invoice_number, sub: `${po.supplier_name} · ${po.total} EGP`, status: po.status })),
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
        customer:      'Customers',
        product:       'Products',
        order:         'Orders',
        supplier:      'Suppliers',
        purchaseOrder: 'Purchase Orders',
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
                        placeholder="Search customers, products, orders, suppliers..."
                        className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
                    />
                    {loading && <span className="text-gray-500 text-xs">Searching...</span>}
                    <kbd className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700">Esc</kbd>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {/* Empty state */}
                    {!query && (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            Type to search customers, products, orders and suppliers...
                            <div className="mt-3 flex justify-center gap-4 text-xs text-gray-600">
                                <span>↑↓ navigate</span>
                                <span>Enter select</span>
                                <span>Esc close</span>
                            </div>
                        </div>
                    )}

                    {/* No results */}
                    {query.length >= 2 && !loading && !hasResults && (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            No results found for "{query}"
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
                                            {r.status}
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