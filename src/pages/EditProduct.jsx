import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'

export default function EditProduct() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [units, setUnits] = useState([])
    const [warehouses, setWarehouses] = useState([])
    const [stocks, setStocks] = useState([])
    const [form, setForm] = useState({
        name: '', sku: '', price: '', unit: '',
        price_a: '', price_b: '', price_c: '', price_d: '', price_e: '',
        secondary_unit: '', conversion_factor: '',
    })

    useEffect(() => {
        Promise.all([
            api.get(`/products/${id}`),
            api.get('/warehouses'),
            api.get('/units'),
        ]).then(([productRes, warehouseRes, unitRes]) => {
            const p = productRes.data.data

            setForm({
                name:              p.name || '',
                sku:               p.sku || '',
                price:             p.price || '',
                unit:              p.unit || '',
                price_a:           p.price_a || '',
                price_b:           p.price_b || '',
                price_c:           p.price_c || '',
                price_d:           p.price_d || '',
                price_e:           p.price_e || '',
                secondary_unit:    p.secondary_unit || '',
                conversion_factor: p.conversion_factor || '',
            })

            // Load existing warehouse stocks
            setStocks(p.stocks.map(s => ({
                warehouse_id:   s.warehouse_id,
                warehouse_name: s.warehouse_name,
                quantity:       s.quantity,
                threshold:      s.threshold,
                isNew:          false,
            })))

            setWarehouses(warehouseRes.data.data)
            setUnits(unitRes.data.data)
        })
        .catch(() => setError('Failed to load product'))
        .finally(() => setLoading(false))
    }, [id])

    const usedWarehouseIds = stocks.map(s => parseInt(s.warehouse_id)).filter(Boolean)

    const addStock = () => setStocks([
        ...stocks,
        { warehouse_id: '', warehouse_name: '', quantity: 0, threshold: 10, isNew: true }
    ])

    const removeStock = (i) => {
        // Only allow removing new (unassigned) warehouse rows
        if (!stocks[i].isNew) return
        setStocks(stocks.filter((_, idx) => idx !== i))
    }

    const updateStock = (i, field, value) => {
        const updated = [...stocks]
        updated[i][field] = value
        setStocks(updated)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            await api.put(`/products/${id}`, {
                ...form,
                price:             parseFloat(form.price),
                price_a:           form.price_a ? parseFloat(form.price_a) : null,
                price_b:           form.price_b ? parseFloat(form.price_b) : null,
                price_c:           form.price_c ? parseFloat(form.price_c) : null,
                price_d:           form.price_d ? parseFloat(form.price_d) : null,
                price_e:           form.price_e ? parseFloat(form.price_e) : null,
                conversion_factor: form.conversion_factor ? parseInt(form.conversion_factor) : null,
                stocks: stocks
                    .filter(s => s.warehouse_id)
                    .map(s => ({
                        warehouse_id: parseInt(s.warehouse_id),
                        quantity:     parseInt(s.quantity) || 0,
                        threshold:    parseInt(s.threshold) || 10,
                    }))
            })
            navigate('/products')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update product')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="">
            <div className="flex items-center gap-4 mb-6">
                <BackButton label="Back to Products" to="/products"/>
                <h2 className="text-2xl font-bold text-white">Edit Product</h2>
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

                    {/* Warehouse Stock */}
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
                                        {stock.isNew ? (
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
                                        ) : (
                                            <div className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm">
                                                {stock.warehouse_name}
                                            </div>
                                        )}
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

                                    <div className="col-span-1 flex justify-end">
                                        {stock.isNew && (
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
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}