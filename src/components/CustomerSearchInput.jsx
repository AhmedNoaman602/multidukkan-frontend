import { useState, useRef, useEffect } from 'react'

export default function CustomerSearchInput({ customers, value, onSelect, placeholder = 'Search by name, phone, or code...' }) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(0)
    const [browseOpen, setBrowseOpen] = useState(false)
    const [browseQuery, setBrowseQuery] = useState('')
    const ref = useRef(null)

    const filterFn = (q) => (c) =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        (c.phone && c.phone.includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q.toLowerCase()))

    const filtered = query.length > 0
        ? customers.filter(filterFn(query)).slice(0, 8)
        : []

    const browseFiltered = browseQuery.length > 0
        ? customers.filter(filterFn(browseQuery))
        : customers

    const selectedCustomer = customers.find(c => c.id === parseInt(value))

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

    const handleSelect = (customer) => {
        onSelect(String(customer.id))
        setQuery('')
        setOpen(false)
        setHighlighted(0)
    }

    const handleBrowseSelect = (customer) => {
        onSelect(String(customer.id))
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

    if (selectedCustomer) {
        return (
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                        <span className="text-blue-400 text-xs font-bold">{selectedCustomer.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="text-white text-sm font-medium">{selectedCustomer.name}</span>
                        <span className="text-gray-400 text-sm ms-2">{selectedCustomer.phone}</span>
                        {selectedCustomer.code && (
                            <span className="text-gray-500 text-xs ms-2">{selectedCustomer.code}</span>
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
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    />

                    {open && filtered.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                            {filtered.map((customer, i) => (
                                <div
                                    key={customer.id}
                                    onMouseDown={() => handleSelect(customer)}
                                    className={`px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                                        i === highlighted ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{customer.name}</span>
                                        <span className={`text-xs ${i === highlighted ? 'text-blue-200' : 'text-gray-400'}`}>{customer.phone}</span>
                                    </div>
                                    {customer.code && (
                                        <div className={`text-xs mt-0.5 ${i === highlighted ? 'text-blue-200' : 'text-gray-500'}`}>{customer.code}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {open && query.length > 0 && filtered.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-3 py-3 text-gray-400 text-sm">
                            No customers found for "{query}"
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

            {/* Browse Customers Modal */}
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
                            <h3 className="text-white font-semibold">Browse Customers</h3>
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
                                placeholder="ابحث بالاسم أو التليفون أو الكود..."
                                autoFocus
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-2">
                                {browseFiltered.length} customer{browseFiltered.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {browseFiltered.map(customer => (
                                <div
                                    key={customer.id}
                                    onClick={() => handleBrowseSelect(customer)}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-800/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                                            <span className="text-blue-400 text-xs font-bold">{customer.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{customer.name}</p>
                                            {customer.code && (
                                                <p className="text-gray-500 text-xs mt-0.5">{customer.code}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm">{customer.phone}</p>
                                </div>
                            ))}
                            {browseFiltered.length === 0 && (
                                <div className="text-center py-12 text-gray-500 text-sm">No customers found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}