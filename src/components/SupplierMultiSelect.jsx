import SupplierSearchInput from './SupplierSearchInput'

// Multi-supplier picker. Reuses SupplierSearchInput in permanent search mode
// (value="" so it never collapses to a single chip) and accumulates picks into
// an array of ids. Already-selected suppliers are removed from the search pool
// so the same one can't be added twice.
export default function SupplierMultiSelect({ suppliers, value = [], onChange, placeholder, allSelectedLabel }) {
    const selected = value
        .map(id => suppliers.find(s => s.id === id))
        .filter(Boolean)

    const available = suppliers.filter(s => !value.includes(s.id))
    const allSelected = suppliers.length > 0 && available.length === 0

    const add = (id) => {
        const numId = parseInt(id)
        if (!numId || value.includes(numId)) return
        onChange([...value, numId])
    }

    const remove = (id) => onChange(value.filter(v => v !== id))

    return (
        <div className="space-y-2">
            {allSelected ? (
                <div className="px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-gray-400 text-center">
                    {allSelectedLabel}
                </div>
            ) : (
                <SupplierSearchInput
                    suppliers={available}
                    value=""
                    onSelect={add}
                    placeholder={placeholder}
                />
            )}

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selected.map(s => (
                        <span
                            key={s.id}
                            className="inline-flex items-center gap-2 ps-2 pe-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                        >
                            <span className="w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 text-[10px] font-bold shrink-0">
                                {s.name.charAt(0)}
                            </span>
                            <span className="truncate max-w-[10rem]">{s.name}</span>
                            <button
                                type="button"
                                onClick={() => remove(s.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                            >
                                ✕
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
