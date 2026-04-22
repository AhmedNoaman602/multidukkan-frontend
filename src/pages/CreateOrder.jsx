import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CreateOrder() {
    const [warehouses, setWarehouses] = useState([])
    const [inventory, setInventory] = useState([])
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [customerId, setCustomerId] = useState('')
    const [items, setItems] = useState([{ product_id: '', quantity: 1, warehouse_id: '', unit_type: 'base' }])
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const [stores, setStores] = useState([])
    const [storeId, setStoreId] = useState(user.store_id || '')
    

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersRes, productsRes, warehousesRes, inventoryRes, storesRes] = await Promise.all([
                    api.get('/customers'),
                    api.get('/products'),
                    api.get('/warehouses'),
                    api.get('/inventory'),
                    api.get('/stores')
                ])
                setCustomers(customersRes.data.data)
                setProducts(productsRes.data.data)
                setWarehouses(warehousesRes.data.data)
                setInventory(inventoryRes.data.data)
                setStores(storesRes.data.data)
            } catch (err) {
                setError('Failed to load data')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const addItem = () => setItems([...items, { product_id: '', quantity: 1, warehouse_id: '', unit_type: 'base' }])
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index))
    const updateItem = (index, field, value) => {
        const updated = [...items]
        updated[index][field] = value
        setItems(updated)
    }

    const selectedCustomer = customers.find(c => c.id === parseInt(customerId))

    const getPriceForCustomer = (product) => {
        if (!selectedCustomer) return product.price
        const tier = selectedCustomer.price_tier
        return (tier !== 'default' && product[`price_${tier}`])
            ? product[`price_${tier}`]
            : product.price
    }

    const getUnitPrice = (product, unitType) => {
        const base = getPriceForCustomer(product)
        return unitType === 'secondary' && product.conversion_factor
            ? base * product.conversion_factor
            : base
    }

    const getTotal = () => {
        return items.reduce((total, item) => {
            const product = products.find(p => p.id === parseInt(item.product_id))
            if (!product || !item.quantity) return total
            return total + (getUnitPrice(product, item.unit_type) * item.quantity)
        }, 0)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            await api.post('/orders', {
                store_id: parseInt(storeId),
                customer_id: parseInt(customerId),
                items: items.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    warehouse_id: item.warehouse_id ? parseInt(item.warehouse_id) : null,
                    unit_type: item.unit_type ?? 'base'
                }))
            })
            navigate('/orders')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-bold text-white">Create New Order</h2>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
{!user.store_id && (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <label className="block text-sm text-gray-400 mb-2">Store</label>
        <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
        >
            <option value="">Select a store</option>
            {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
            ))}
        </select>
    </div>
)}
                {/* Customer */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <label className="block text-sm text-gray-400 mb-2">Customer</label>
                    <select
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    >
                        <option value="">Select a customer</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                        ))}
                    </select>
                </div>

                {/* Items */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Order Items</h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                        >
                            + Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => {
                            const product = products.find(p => p.id === parseInt(item.product_id))
                            return (
                                <div key={index} className="p-4 bg-gray-800 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Product */}
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Product</label>
                                            <select
                                                value={item.product_id}
                                                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                required
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                            >
                                                <option value="">Select product</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} — {getPriceForCustomer(p)} EGP
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Quantity */}
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                required
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Warehouse */}
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Warehouse</label>
                                           <select
    value={item.warehouse_id}
    onChange={(e) => updateItem(index, 'warehouse_id', e.target.value)}
    required
    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
>
    <option value="">Select warehouse</option>
    {warehouses.filter(w => !storeId || w.store_id === parseInt(storeId)).map(w => {
        const stock = inventory.find(
            inv => inv.warehouse_id === w.id &&
            inv.product_id === parseInt(item.product_id)
        )
        const qty = stock ? stock.quantity : 0
        return (
            <option key={w.id} value={w.id}>
                {w.name} — {qty} متاح
            </option>
        )
    })}
</select>
                                        </div>

                                        {/* Unit type */}
                                        <div>
                                            {product?.secondary_unit && (
                                                <>
                                                    <label className="block text-xs text-gray-400 mb-1">Unit</label>
                                                    <div className="flex gap-2">
                                                        {['base', 'secondary'].map(u => (
                                                            <button
                                                                key={u}
                                                                type="button"
                                                                onClick={() => updateItem(index, 'unit_type', u)}
                                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                    item.unit_type === u
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                                }`}
                                                            >
                                                                {u === 'base' ? product.unit : product.secondary_unit}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item total + remove */}
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-sm text-gray-400">
                                            {product ? (
                                                <>
                                                    {getUnitPrice(product, item.unit_type)} × {item.quantity} =
                                                    <span className="text-white font-medium ml-1">
                                                        {getUnitPrice(product, item.unit_type) * item.quantity} EGP
                                                    </span>
                                                </>
                                            ) : '—'}
                                        </span>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-400 hover:text-red-300 text-sm transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Total + Submit */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm">Order Total</p>
                        <p className="text-3xl font-bold text-white">{getTotal()} EGP</p>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                    >
                        {saving ? 'Creating...' : 'Create Order'}
                    </button>
                </div>
            </form>
        </div>
    )
}