import { useState, useEffect, useRef } from 'react'

export default function SupplierSearchInput({ suppliers, value, onChange, onSelect, placeholder = "Search suppliers..." }) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [showBrowseModal, setShowBrowseModal] = useState(false)
    const dropdownRef = useRef(null)
    const inputRef = useRef(null)
    const [highlightedIndex, setHighlightedIndex] = useState(0)

    const selectedSupplier = suppliers.find(s => s.id === value)

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.includes(search) ||
        s.code?.toLowerCase().includes(search.toLowerCase())
    )

    useEffect(() => {
        if (isOpen && filteredSuppliers.length > 0) {
            setHighlightedIndex(0)
        }
    }, [search, isOpen])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault()
                setIsOpen(true)
            }
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightedIndex(prev => 
                    prev < filteredSuppliers.length - 1 ? prev + 1 : prev
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
                break
            case 'Enter':
                e.preventDefault()
                if (filteredSuppliers[highlightedIndex]) {
                    handleSelect(filteredSuppliers[highlightedIndex])
                }
                break
            case 'Escape':
                e.preventDefault()
                setIsOpen(false)
                break
        }
    }

    const handleSelect = (supplier) => {
        onSelect(supplier)
        setIsOpen(false)
        setSearch('')
    }

    const handleClear = () => {
        onSelect(null)
        setSearch('')
        inputRef.current?.focus()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {selectedSupplier ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {selectedSupplier.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">{selectedSupplier.name}</div>
                            <div className="text-gray-400 text-xs">{selectedSupplier.phone}</div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <span className="text-gray-400 text-sm">✕</span>
                    </button>
                </div>
            ) : (
                <>
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    />

                    {isOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-auto">
                            {filteredSuppliers.length > 0 ? (
                                filteredSuppliers.map((supplier, index) => (
                                    <button
                                        key={supplier.id}
                                        type="button"
                                        onClick={() => handleSelect(supplier)}
                                        className={`w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors ${
                                            index === highlightedIndex ? 'bg-gray-700' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                                                {supplier.name[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-sm font-medium truncate">{supplier.name}</div>
                                                <div className="text-gray-400 text-xs">{supplier.phone}</div>
                                            </div>
                                            {supplier.code && (
                                                <span className="text-xs text-gray-500">{supplier.code}</span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                    No suppliers found
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setShowBrowseModal(true)
                                    setIsOpen(false)
                                }}
                                className="w-full px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 transition-colors border-t border-gray-700"
                            >
                                Browse All Suppliers
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Browse All Modal */}
            {showBrowseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBrowseModal(false)}>
                    <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Select Supplier</h3>
                            <button onClick={() => setShowBrowseModal(false)} className="text-gray-400 hover:text-white">
<span className="text-gray-400 text-sm">✕</span>                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[calc(80vh-120px)]">
                            <div className="space-y-1">
                                {suppliers.map(supplier => (
                                    <button
                                        key={supplier.id}
                                        type="button"
                                        onClick={() => {
                                            handleSelect(supplier)
                                            setShowBrowseModal(false)
                                        }}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                                {supplier.name[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-white font-medium">{supplier.name}</div>
                                                <div className="text-gray-400 text-sm">{supplier.phone}</div>
                                            </div>
                                            {supplier.code && (
                                                <span className="text-gray-500 text-sm">{supplier.code}</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                                    {filteredSuppliers.length === 0 && (
                                        <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                            No suppliers found
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}