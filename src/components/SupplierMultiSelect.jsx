import SupplierSearchInput from './SupplierSearchInput'
import { useLookupTotal } from '../hooks/useLookup'

// Multi-supplier picker. Reuses SupplierSearchInput in permanent search mode
// (nothing selected, so it never collapses to a single chip) and accumulates picks.
// `value` holds the picked supplier objects, so the chips show names without loading
// every supplier. Already-picked suppliers are hidden from the search so the same one
// can't be added twice; the lookup's total tells when every supplier is linked.
export default function SupplierMultiSelect({ value = [], onChange, placeholder, allSelectedLabel }) {
    const selected = value
    const total = useLookupTotal('/suppliers/lookup')
    const allSelected = total > 0 && selected.length >= total

    const add = (supplier) => {
        if (!supplier || selected.some(s => s.id === supplier.id)) return
        onChange([...selected, supplier])
    }

    const remove = (id) => onChange(selected.filter(s => s.id !== id))

    return (
        <div className="space-y-2">
            {allSelected ? (
                <div className="px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-sm text-gray-400 text-center">
                    {allSelectedLabel}
                </div>
            ) : (
                <SupplierSearchInput
                    selected={null}
                    onSelect={add}
                    excludeIds={selected.map(s => s.id)}
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
