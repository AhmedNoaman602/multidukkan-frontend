import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CreatePurchaseOrder() {
    const [warehouses, setWarehouses] = useState([])
    const [inventory, setInventory] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [supplierId, setSupplierId] = useState('')
    const [items, setItems] = useState([{ product_id: '', quantity: 1, warehouse_id: '', unit_type: 'base' }])
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const [stores, setStores] = useState([])
    const [storeId, setStoreId] = useState(user.store_id || '')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersRes, productsRes, warehousesRes, inventoryRes, storesRes] = await Promise.all([
                    api.get('/suppliers'),
                    api.get('/products'),
                    api.get('/warehouses'),
                    api.get('/inventory'),
                    api.get('/stores')
                ])
                setSuppliers(suppliersRes.data.data)
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
    if (field === 'quantity' && value !== '') {
        value = String(Math.floor(Number(value)) || 1)
    }
    updated[index][field] = value
    setItems(updated)
}

    const selectedSupplier = suppliers.find(s => s.id === parseInt(supplierId))

    const getDisplayPrice = (product) => {
        if (!selectedSupplier) return product.price
        const tier = selectedSupplier.price_tier
        return (tier !== 'default' && product[`price_${tier}`])
            ? product[`price_${tier}`]
            : product.price
    }

    const getUnitPrice = (product, unitType) => {
        const base = getDisplayPrice(product)
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
    const getAvailableStock = (warehouseId, productId, currentIndex) => {
    const inventoryRow = inventory.find(
        inv => inv.warehouse_id === warehouseId && inv.product_id === productId
    )
    const available = inventoryRow ? inventoryRow.quantity : 0

    // Subtract quantities already committed in other rows for same product+warehouse
    const committed = items.reduce((sum, item, idx) => {
        if (
            idx !== currentIndex &&
            parseInt(item.product_id) === productId &&
            parseInt(item.warehouse_id) === warehouseId
        ) {
            return sum + (parseInt(item.quantity) || 0)
        }
        return sum
    }, 0)

    return Math.max(0, available - committed)
}

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        const invalidQty = items.some(item => !Number.isInteger(Number(item.quantity)))
        if (invalidQty) {
            setError('Quantity must be a whole number.')
            setSaving(false)
            return
        }
        try {
            await api.post('/purchase-orders', {
                supplier_id: parseInt(supplierId),
                items: items.map(item => {
                    const product = products.find(p => p.id === parseInt(item.product_id))
                    return {
                        product_id: parseInt(item.product_id),
                        quantity: parseInt(item.quantity),
                        warehouse_id: parseInt(item.warehouse_id),
                        unit_type: item.unit_type ?? 'base',
                        unit_price: product ? getUnitPrice(product, item.unit_type) : 0
                    }
                })
            })
            navigate('/purchase-orders')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create purchase order')
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
                <h2 className="text-2xl font-bold text-white">Create New Purchase Order</h2>
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
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
        >
            <option value="">Select a store</option>
            {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
            ))}
        </select>
    </div>
)}
                {/* Supplier */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <label className="block text-sm text-gray-400 mb-2">Supplier</label>
                    <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                    >
                        <option value="">Select a supplier</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name} — {s.phone}</option>
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
                                                        {p.name} — {getDisplayPrice(p)} EGP
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
                                                step="1"
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
        
const qty = getAvailableStock(w.id, parseInt(item.product_id), index)
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
    <div className="flex flex-col items-end gap-3">
        <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
            {saving ? 'Creating...' : 'Create purchase Order'}
        </button>
    </div>
</div>
            </form>
        </div>
    )
}