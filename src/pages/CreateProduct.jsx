import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function CreateProduct() {
    const [warehouses, setWarehouses] = useState([])
    const [stockUnit, setStockUnit] = useState('base')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '', sku: '', price: '', unit: 'حتة',
        price_a: '', price_b: '', price_c: '', price_d: '', price_e: '',
        secondary_unit: '', conversion_factor: '',
    })
    const [stocks, setStocks] = useState([
    { warehouse_id: '', quantity: 0, threshold: 10 , unit_type:'base' }
])
    const navigate = useNavigate()
    const [units, setUnits] = useState([])

    useEffect(() => {
        api.get('/warehouses').then(res => setWarehouses(res.data.data))
        api.get('/units').then(res => setUnits(res.data.data))
    }, [])
const addStock = () => setStocks([...stocks, { warehouse_id: '', quantity: 0, threshold: 10, unit_type: 'base' }])
const removeStock = (i) => setStocks(stocks.filter((_, idx) => idx !== i))
const updateStock = (i, field, value) => {
    const updated = [...stocks]
    updated[i][field] = value
    setStocks(updated)
}

const usedWarehouseIds = stocks.map(s => parseInt(s.warehouse_id)).filter(Boolean)

   const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
        await api.post('/products', {
            ...form,
            price: parseFloat(form.price),
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
        setError(err.response?.data?.message || 'Failed to create product')
    } finally {
        setSaving(false)
    }
}

    return (
        <div className="">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-bold text-white">Add New Product</h2>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

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
                        <label className="block text-sm text-gray-400 mb-1">Unit</label>
                        <select
                            value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        >
                            {units.map(u => (
                                 <option key={u.id} value={u.name}>{u.name}</option>
                                ))}
                        </select>
                    </div>

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

                    {/* Warehouse Stock — full width */}
<div className="col-span-2">
    <div className="flex items-center justify-between mb-3">
        <label className="text-sm text-gray-400">Warehouse Stock</label>
        <button
            type="button"
            onClick={addStock}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
        >
            + Add Warehouse
        </button>
    </div>

    <div className="space-y-3">
        {stocks.map((stock, i) => (
            <div key={i} className="grid grid-cols-7 gap-3 items-end bg-gray-800 p-3 rounded-lg">
                <div className="col-span-3">
                    <label className="block text-xs text-gray-400 mb-1">Warehouse</label>
                    <select
                        value={stock.warehouse_id}
                        onChange={(e) => updateStock(i, 'warehouse_id', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    >
                        <option value="">Select warehouse</option>
                        {warehouses
                            .filter(w => !usedWarehouseIds.includes(w.id) || w.id === parseInt(stock.warehouse_id))
                            .map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))
                        }
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                    <input
                        type="number"
                        min="0"
                        value={stock.quantity}
                        onChange={(e) => updateStock(i, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    />
                </div>

                <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1">Threshold</label>
                    <input
                        type="number"
                        min="0"
                        value={stock.threshold}
                        onChange={(e) => updateStock(i, 'threshold', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    />
                </div>
                {form.secondary_unit && form.conversion_factor && (
    <div className="col-span-7 flex gap-2 mt-1">
        {['base', 'secondary'].map(u => (
            <button
                key={u}
                type="button"
                onClick={() => updateStock(i, 'unit_type', u)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    stock.unit_type === u
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
            >
                {u === 'base' ? form.unit : form.secondary_unit}
            </button>
        ))}
        {stock.unit_type === 'secondary' && form.conversion_factor && stock.quantity > 0 && (
            <span className="text-xs text-blue-400 self-center ml-2">
                = {parseInt(stock.quantity) * parseInt(form.conversion_factor)} {form.unit}
            </span>
        )}
    </div>
)}

                <div className="col-span-1 flex justify-end">
                    {stocks.length > 1 && (
                        <button
                            type="button"
                            onClick={() => removeStock(i)}
                            className="px-3 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        ))}
    </div>
</div>

                    <div className="col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}