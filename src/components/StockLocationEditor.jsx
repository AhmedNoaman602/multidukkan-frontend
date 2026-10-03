import { useTranslation } from '../i18n/useTranslation'
import { formatUnitBreakdown } from '../lib/format'
import { isShelf, sortShelfFirst } from '../lib/locations'

const ShelfBadge = () => {
    const { t } = useTranslation()
    return <span className="ms-1.5 px-1.5 py-0.5 bg-blue-500/15 text-blue-400 text-[10px] rounded">{t('common.shelf')}</span>
}

/**
 * Stock per location, in the unit the user picks. Rows are sent as
 * { warehouse_id, quantity, unit_type, threshold }; the server converts to base units.
 * Existing rows (isNew: false) keep their location; only new rows can be removed.
 */
export default function StockLocationEditor({ rows, onChange, warehouses, stores = [], unit, secondaryUnit, conversionFactor }) {
    const { t } = useTranslation()
    const factor = Number(conversionFactor) || 0
    const hasSecondary = !!secondaryUnit && factor > 1
    const product = { unit, secondary_unit: secondaryUnit, conversion_factor: factor }

    const usedIds = rows.map(r => parseInt(r.warehouse_id)).filter(Boolean)
    const locationLabel = (w) => {
        const store = stores.length > 1 ? stores.find(s => s.id === w.store_id)?.name : null
        return [w.name, isShelf(w) ? `(${t('common.shelf')})` : null, store ? `· ${store}` : null].filter(Boolean).join(' ')
    }

    const update = (i, changes) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...changes } : r)))
    const remove = (i) => onChange(rows.filter((_, idx) => idx !== i))
    const add = () => onChange([...rows, { warehouse_id: '', quantity: '', loose_quantity: '', unit_type: 'base', threshold: 10, isNew: true }])

    // Base units a row stands for: "2 box + 7 pcs" = 31. Display only — the server converts.
    const baseOf = (row) => {
        const secondary = row.unit_type === 'secondary' && hasSecondary
        return (parseInt(row.quantity) || 0) * (secondary ? factor : 1)
            + (secondary ? parseInt(row.loose_quantity) || 0 : 0)
    }

    // Switching the unit re-expresses the same stock: "31 pcs" ↔ "2 box + 7 pcs", never "31 box".
    // What is sent is still the entered quantities and their unit.
    const switchUnit = (i, unitType) => {
        const row = rows[i]
        if (row.unit_type === unitType) return
        if (row.quantity === '' && !row.loose_quantity) return update(i, { unit_type: unitType })

        const base = baseOf(row)
        update(i, unitType === 'secondary'
            ? { unit_type: unitType, quantity: Math.floor(base / factor), loose_quantity: base % factor || '' }
            : { unit_type: unitType, quantity: base, loose_quantity: '' })
    }
    const cell = 'px-2 py-1.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm'

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-white text-sm font-semibold">
                    {t('products.form.warehouseStock')}
                    {rows.length > 0 && <span className="ms-1.5 text-gray-500 font-normal">({rows.length})</span>}
                </h3>
                <button type="button" onClick={add} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors">
                    {t('products.form.addWarehouse')}
                </button>
            </div>

            <table className="w-full">
                <thead className="bg-gray-800">
                    <tr>
                        {['common.warehouse', 'common.quantity', 'products.form.threshold', null].map(key => (
                            <th key={key ?? 'actions'} className="px-3 py-2 text-start text-[11px] font-medium text-gray-400 uppercase tracking-wider">{key ? t(key) : ''}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                    {rows.map((row, i) => {
                        const location = warehouses.find(w => w.id === parseInt(row.warehouse_id))
                        return (
                            <tr key={i} className="hover:bg-gray-800/30 transition-colors align-top">
                                <td className="px-3 py-2">
                                    {row.isNew ? (
                                        <select value={row.warehouse_id} onChange={e => update(i, { warehouse_id: e.target.value })} className={`w-full ${cell}`}>
                                            <option value="">{t('products.form.chooseWarehouse')}</option>
                                            {sortShelfFirst(warehouses)
                                                .filter(w => !usedIds.includes(w.id) || w.id === parseInt(row.warehouse_id))
                                                .map(w => <option key={w.id} value={w.id}>{locationLabel(w)}</option>)}
                                        </select>
                                    ) : (
                                        <div className="px-2 py-1.5 text-white text-sm">
                                            {row.warehouse_name ?? location?.name}
                                            {(row.warehouse_type === 'shelf' || isShelf(location)) && <ShelfBadge />}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={row.quantity}
                                        onChange={e => update(i, { quantity: e.target.value, quantityEdited: true })}
                                        className={`w-24 text-center ${cell}`}
                                    />
                                    {hasSecondary && (
                                        <div className="flex flex-wrap gap-1 mt-1 items-center">
                                            {['base', 'secondary'].map(u => (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    onClick={() => switchUnit(i, u)}
                                                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                                        row.unit_type === u ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                                                    }`}
                                                >
                                                    {u === 'base' ? unit : secondaryUnit}
                                                </button>
                                            ))}
                                            {row.unit_type === 'secondary' && (
                                                <>
                                                    <span className="text-xs text-gray-500 ms-1">+</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={row.loose_quantity ?? ''}
                                                        onChange={e => update(i, { loose_quantity: e.target.value, quantityEdited: true })}
                                                        placeholder="0"
                                                        aria-label={unit}
                                                        className="w-14 px-1.5 py-0.5 bg-gray-800 border border-gray-700 text-white rounded text-xs text-center focus:outline-none focus:border-blue-500"
                                                    />
                                                    <span className="text-xs text-gray-500">{unit}</span>
                                                    {(row.quantity !== '' || row.loose_quantity) && (
                                                        <span className="text-xs text-blue-400 ms-1">= {formatUnitBreakdown(baseOf(row), product)}</span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={row.threshold}
                                        onChange={e => update(i, { threshold: e.target.value })}
                                        className={`w-24 text-center ${cell}`}
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    {row.isNew && (
                                        <button type="button" onClick={() => remove(i)} className="text-gray-600 hover:text-red-400 transition-colors text-xs">✕</button>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
