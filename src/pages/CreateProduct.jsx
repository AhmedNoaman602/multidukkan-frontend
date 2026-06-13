import { useState, useEffect, useRef } from 'react'
import { useNavigate , useLocation} from 'react-router-dom'
import api from '../api/axios'
import BackButton from '../components/BackButton'
import SupplierSearchInput from '../components/SupplierSearchInput'
import {useToast} from '../hooks/useToast'


export default function CreateProduct() {
    const [warehouses, setWarehouses] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [supplierId, setSupplierId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [generatingDesc, setGeneratingDesc] = useState(false)
    const [newUnit, setNewUnit] = useState('')
    const [showNewUnit, setShowNewUnit] = useState(false)
    const [savingUnit, setSavingUnit] = useState(false)
    const stockBottomRef = useRef(null)
    const location = useLocation()
    const duplicate = location.state?.duplicate
    const [form, setForm] = useState({
    name: duplicate ? `${duplicate.name}` : '',
    sku: duplicate ? `${duplicate.sku}` : '',
    price: duplicate?.price || '',
    unit: duplicate?.unit || '',
    price_a: duplicate?.price_a || '',
    price_b: duplicate?.price_b || '',
    price_c: duplicate?.price_c || '',
    price_d: duplicate?.price_d || '',
    price_e: duplicate?.price_e || '',
    cost_price: duplicate?.cost_price || '',
    secondary_unit: duplicate?.secondary_unit || '',
    conversion_factor: duplicate?.conversion_factor || '',
    description: '',
    description_ar: '',
    description_en: '',
    supplier_id: '',
})
    const [stocks, setStocks] = useState([
        { warehouse_id: '', quantity: 1, threshold: 10, unit_type: 'base' }
    ])
    const navigate = useNavigate()
    const [units, setUnits] = useState([])
    const { showToast } = useToast()
    

    useEffect(() => {
        api.get('/warehouses').then(res => setWarehouses(res.data.data))
        api.get('/units').then(res => {
            setUnits(res.data.data)
            if (res.data.data.length > 0) {
                setForm(f => ({ ...f, unit: res.data.data[0].name }))
            }
        })
        api.get('/suppliers').then(res => setSuppliers(res.data.data))
    }, [])

    const addStock = () => {
        setStocks([...stocks, { warehouse_id: '', quantity: 1, threshold: 10, unit_type: 'base' }])
        setTimeout(() => {
            stockBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
    }
    const removeStock = (i) => setStocks(stocks.filter((_, idx) => idx !== i))
    const updateStock = (i, field, value) => {
        const updated = [...stocks]
        updated[i][field] = value
        setStocks(updated)
    }

    const usedWarehouseIds = stocks.map(s => parseInt(s.warehouse_id)).filter(Boolean)

    const handleSaveUnit = async () => {
        if (!newUnit.trim()) return
        setSavingUnit(true)
        try {
            const res = await api.post('/units', { name: newUnit.trim() })
            const saved = res.data.data ?? res.data
            setUnits(prev => [...prev, saved])
            setForm(f => ({ ...f, unit: saved.name }))
            showToast('Unit created successfully', 'success')
            setNewUnit('')
            setShowNewUnit(false)
        } catch {
            showToast('Failed to save unit', 'error')
        } finally {
            setSavingUnit(false)
        }
    }

    const handleGenerateDescription = async () => {
        if (!form.name || !form.price || !form.unit) {
            showToast('Please fill in name, price and unit first.', 'error')
            return
        }
        setGeneratingDesc(true)
        try {
            const res = await api.post('/ai/describe-product', {
                name: form.name,
                price: parseFloat(form.price),
            })
            setForm(f => ({
                ...f,
                description_ar: res.data.ar,
                description_en: res.data.en,
                description: `${res.data.ar}\n${res.data.en}`,
            }))
        } catch {
            showToast('Failed to generate description' , 'error')
        } finally {
            setGeneratingDesc(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        const hasEmptyWarehouse = stocks.some(s => !s.warehouse_id)
    if (hasEmptyWarehouse) {
        showToast('Please select a warehouse for all stock rows, or remove empty rows.', 'error')
        setSaving(false)
        return
    }

    const hasInvalidQuantity = stocks.some(s => 
        s.warehouse_id && (!s.quantity || parseInt(s.quantity) <= 0)
    )
    if (hasInvalidQuantity) {
        showToast('Please enter a quantity greater than 0 for all warehouse rows.', 'error')
        setSaving(false)
        return
    }
        try {
            await api.post('/products', {
                ...form,
                supplier_id: supplierId ?? null,
                price: parseFloat(form.price),
                cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
                stocks: stocks
                    .filter(s => s.warehouse_id)
                    .map(s => ({
                        warehouse_id: parseInt(s.warehouse_id),
                        quantity: s.unit_type === 'secondary' && form.conversion_factor
                            ? parseInt(s.quantity) * parseInt(form.conversion_factor)
                            : parseInt(s.quantity) || 0,
                        threshold: parseInt(s.threshold) || 10,
                    }))
            })
            navigate('/products')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create product', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <BackButton label="Back to Products" to="/products" />
                <h2 className="text-2xl font-bold text-white">Add New Product</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Basic Info */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Basic Info</h3>
                    <div className="grid grid-cols-2 gap-4">

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">SKU</label>
                            <input
                                value={form.sku}
                                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                        <div className="col-span-2">
    <label className="block text-sm text-gray-400 mb-1">
        Supplier <span className="text-gray-600">(optional)</span>
    </label>
    <SupplierSearchInput
        suppliers={suppliers}
        value={supplierId}
        onSelect={setSupplierId}
        placeholder="Search suppliers..."
    />
</div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Default Price</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                         <div>
    <label className="block text-sm text-gray-400 mb-1">
        Cost Price <span className="text-gray-600">(optional)</span>
    </label>
    <input
        type="number"
        value={form.cost_price}
        onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
        placeholder="What you paid for it"
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm placeholder-gray-600"
    />
</div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Unit</label>
                            <div className="flex gap-2">
                                <select
                                    value={form.unit}
                                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                >
                                    {units.map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowNewUnit(!showNewUnit)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
                                >
                                    + New
                                </button>
                            </div>
                            {showNewUnit && (
                                <div className="flex gap-2 mt-2">
                                    <input
                                        value={newUnit}
                                        onChange={(e) => setNewUnit(e.target.value)}
                                        placeholder="e.g. كرتونة"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveUnit())}
                                        className="flex-1 px-3 py-2 bg-gray-800 border border-blue-500 text-white rounded-lg focus:outline-none text-sm"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSaveUnit}
                                        disabled={savingUnit}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs transition-colors"
                                    >
                                        {savingUnit ? '...' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="col-span-2">
    <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-gray-400">Description</label>
        <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={generatingDesc || !form.name || !form.price}
            className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 disabled:opacity-40 text-xs font-medium rounded-lg transition-colors"
        >
            {generatingDesc ? 'Generating...' : '✨ Generate with AI'}
        </button>
    </div>
    <textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={3}
        placeholder="Product description (or generate with AI above)"
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none placeholder-gray-600"
    />
</div>
                    </div>
                </div>

                {/* Price Tiers */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Price Tiers</h3>
                    <div className="grid grid-cols-5 gap-4">
                        {['a', 'b', 'c', 'd', 'e'].map(tier => (
                            <div key={tier}>
                                <label className="block text-sm text-gray-400 mb-1">سعر {tier.toUpperCase()}</label>
                                <input
                                    type="number"
                                    value={form[`price_${tier}`]}
                                    onChange={(e) => setForm({ ...form, [`price_${tier}`]: e.target.value })}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm placeholder-gray-600"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Secondary Unit */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Secondary Unit <span className="text-gray-600 normal-case font-normal">(optional)</span></h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Secondary Unit</label>
                            <input
                                value={form.secondary_unit}
                                onChange={(e) => setForm({ ...form, secondary_unit: e.target.value })}
                                placeholder="e.g. دستة"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm placeholder-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Conversion Factor</label>
                            <input
                                type="number"
                                value={form.conversion_factor}
                                onChange={(e) => setForm({ ...form, conversion_factor: e.target.value })}
                                placeholder="e.g. 12"
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm placeholder-gray-600"
                            />
                            {form.secondary_unit && form.conversion_factor && (
                                <p className="text-xs text-blue-400 mt-1">
                                    1 {form.secondary_unit} = {form.conversion_factor} {form.unit}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Warehouse Stock */}
<div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
    <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-white text-sm font-semibold">
            Warehouse Stock
            {stocks.length > 0 && <span className="ml-1.5 text-gray-500 font-normal">({stocks.length})</span>}
        </h3>
        <button
            type="button"
            onClick={addStock}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
        >
            + Add Warehouse
        </button>
    </div>

    <table className="w-full">
        <thead className="bg-gray-800">
            <tr>
                {['Warehouse', 'Quantity', 'Threshold', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
            {stocks.map((stock, i) => (
                <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-3 py-2">
                        <select
                            value={stock.warehouse_id}
                            onChange={(e) => updateStock(i, 'warehouse_id', e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        >
                            <option value="">Select warehouse</option>
                            {warehouses
                                .filter(w => !usedWarehouseIds.includes(w.id) || w.id === parseInt(stock.warehouse_id))
                                .map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                        </select>
                    </td>
                    <td className="px-3 py-2">
                        <input
                            type="number"
                            min="1"
                            value={stock.quantity}
                            onChange={(e) => updateStock(i, 'quantity', e.target.value)}
                            className="w-24 px-2 py-1.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm text-center"
                        />
                        {form.secondary_unit && form.conversion_factor && (
                            <div className="flex gap-1 mt-1">
                                {['base', 'secondary'].map(u => (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => updateStock(i, 'unit_type', u)}
                                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                            stock.unit_type === u
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-400'
                                        }`}
                                    >
                                        {u === 'base' ? form.unit : form.secondary_unit}
                                    </button>
                                ))}
                                {stock.unit_type === 'secondary' && stock.quantity > 0 && (
                                    <span className="text-xs text-blue-400 self-center ml-1">
                                        = {parseInt(stock.quantity) * parseInt(form.conversion_factor)} {form.unit}
                                    </span>
                                )}
                            </div>
                        )}
                    </td>
                    <td className="px-3 py-2">
                        <input
                            type="number"
                            min="0"
                            value={stock.threshold}
                            onChange={(e) => updateStock(i, 'threshold', e.target.value)}
                            className="w-24 px-2 py-1.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm text-center"
                        />
                    </td>
                    <td className="px-3 py-2">
                        {stocks.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeStock(i)}
                                className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </td>
                </tr>
                
            ))}
                        <tr ref={stockBottomRef} />

        </tbody>
    </table>
</div>

                {/* Submit */}
<div className="flex flex-col items-end gap-2">
    <button
        type="submit"
        disabled={saving}
        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
    >
        {saving ? 'Saving...' : 'Save Product'}
    </button>
</div>

            </form>
        </div>
    )
}