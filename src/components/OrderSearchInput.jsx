import { useState, useRef, useEffect } from 'react'

export default function OrderSearchInput({
    orders,
    value,
    onSelect,
    placeholder = 'ابحث برقم الفاتورة...',
    renderMeta = (order) => `${order.total} EGP`,
}) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(0)
    const [browseOpen, setBrowseOpen] = useState(false)
    const [browseQuery, setBrowseQuery] = useState('')
    const ref = useRef(null)

    const filterFn = (q) => (o) =>
        o.invoice_number?.toLowerCase().includes(q.toLowerCase())

    const filtered = query.length > 0
        ? orders.filter(filterFn(query)).slice(0, 8)
        : []

    const browseFiltered = browseQuery.length > 0
        ? orders.filter(filterFn(browseQuery))
        : orders

    const selectedOrder = orders.find(o => o.id === parseInt(value))

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

    const handleSelect = (order) => {
        onSelect(String(order.id))
        setQuery('')
        setOpen(false)
        setHighlighted(0)
    }

    const handleBrowseSelect = (order) => {
        onSelect(String(order.id))
        setBrowseOpen(false)
        setBrowseQuery('')
    }

    const handleClear = () => {
        onSelect('')
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
            handleSelect(filtered[highlighted])
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    if (selectedOrder) {
        return (
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="min-w-0">
                    <span className="text-white text-sm font-medium font-mono">{selectedOrder.invoice_number}</span>
                    <span className="text-gray-400 text-sm ms-2">{renderMeta(selectedOrder)}</span>
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
                        placeholder={placeholder}
                        autoComplete="off"
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                    />

                    {open && filtered.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                            {filtered.map((order, i) => (
                                <div
                                    key={order.id}
                                    onMouseDown={() => handleSelect(order)}
                                    className={`px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                                        i === highlighted ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium font-mono">{order.invoice_number}</span>
                                        <span className={`text-xs ${i === highlighted ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {renderMeta(order)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {open && query.length > 0 && filtered.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-3 py-3 text-gray-400 text-sm">
                            No orders found for "{query}"
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setBrowseOpen(true)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 text-sm rounded-lg transition-colors whitespace-nowrap"
                >
                    Browse
                </button>
            </div>

            {/* Browse Orders Modal */}
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
                            <h3 className="text-white font-semibold">Browse Orders</h3>
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
                                placeholder="ابحث برقم الفاتورة..."
                                autoFocus
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-2">
                                {browseFiltered.length} order{browseFiltered.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {browseFiltered.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => handleBrowseSelect(order)}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800/50"
                                >
                                    <span className="text-white text-sm font-medium font-mono">{order.invoice_number}</span>
                                    <span className="text-gray-400 text-sm">{renderMeta(order)}</span>
                                </div>
                            ))}
                            {browseFiltered.length === 0 && (
                                <div className="text-center py-12 text-gray-500 text-sm">No orders found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
