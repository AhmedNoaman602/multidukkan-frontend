import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function CreateProduct() {
    const [warehouses, setWarehouses] = useState([])
    const [stockUnit, setStockUnit] = useState('base')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '', sku: '', price: '', unit: 'حبة',
        price_a: '', price_b: '', price_c: '', price_d: '', price_e: '',
        secondary_unit: '', conversion_factor: '',
        warehouse_id: '', quantity: 0, threshold: 10
    })
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/warehouses').then(res => setWarehouses(res.data.data))
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const actualQuantity = stockUnit === 'secondary' && form.conversion_factor
                ? parseInt(form.quantity) * parseInt(form.conversion_factor)
                : parseInt(form.quantity)

            await api.post('/products', {
                ...form,
                price: parseFloat(form.price),
                quantity: actualQuantity
            })
            navigate('/products')
        } catch (err) {
            setError('Failed to create product')
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
                            <option value="حبة">حبة</option>
                            <option value="كيس">كيس</option>
                            <option value="لفة">لفة</option>
                            <option value="دستة">دستة</option>
                            <option value="كرتونة">كرتونة</option>
                            <option value="pcs">pcs</option>
                            <option value="kg">kg</option>
                            <option value="box">box</option>
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

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Warehouse</label>
                        <select
                            value={form.warehouse_id}
                            onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        >
                            <option value="">Select warehouse</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {form.secondary_unit && form.conversion_factor && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Add stock as</label>
                            <div className="flex gap-2">
                                {['base', 'secondary'].map(u => (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => setStockUnit(u)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            stockUnit === u
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        {u === 'base' ? form.unit : form.secondary_unit}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">
                            Quantity (in {stockUnit === 'secondary' ? form.secondary_unit : form.unit})
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                        {stockUnit === 'secondary' && form.conversion_factor && form.quantity > 0 && (
                            <p className="text-xs text-blue-400 mt-1">
                                = {form.quantity * parseInt(form.conversion_factor)} {form.unit}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Low Stock Alert</label>
                        <input
                            type="number"
                            min="0"
                            value={form.threshold}
                            onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
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