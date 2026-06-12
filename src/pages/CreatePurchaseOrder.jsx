import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import ProductSearchInput from '../components/ProductSearchInput'
import SupplierSearchInput from '../components/SupplierSearchInput'
import { useToast } from '../hooks/useToast'
const STORAGE_KEY = 'createPurchaseOrderDraft'

export default function CreatePurchaseOrder() {
    const [warehouses, setWarehouses] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [stores, setStores] = useState([])
    const [flashIndex, setFlashIndex] = useState(-1)
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const productSearchRef = useRef(null)
    const {showToast} = useToast()

    // ---- Form state (restored from draft) ----
    const draft = (() => {
        try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {} }
        catch { return {} }
    })()


    const [storeId, setStoreId] = useState(draft.storeId || '')
    const [supplierId, setSupplierId] = useState(draft.supplierId || '')
    const [items, setItems] = useState(draft.items || [])

    const [orderDate, setOrderDate] = useState(() => {
        const today = new Date().toISOString().split('T')[0]
        const saved = localStorage.getItem('order_draft_date')
        return saved || today
    })
    useEffect(() => {
        localStorage.setItem('order_draft_date', orderDate)
    }, [orderDate])
    // Set store from user or saved default
    useEffect(() => {
        if (user.store_id) {
            setStoreId(String(user.store_id))
        } else if (!draft.storeId) {
            const saved = localStorage.getItem('default_store_id')
            if (saved) setStoreId(saved)
        }
    }, [])

      useEffect(() => {
        if (stores.length > 0 && !storeId) {
            const id = String(stores[0].id)
            setStoreId(id)
            localStorage.setItem('default_store_id', id)
        }
    }, [stores])


    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersRes, productsRes, warehousesRes, storesRes] = await Promise.all([
                    api.get('/suppliers'),
                    api.get('/products?per_page=all'),
                    api.get('/warehouses'),
                    api.get('/stores'),
                ])
                setSuppliers(suppliersRes.data.data)
                setProducts(productsRes.data.data)
                setWarehouses(warehousesRes.data.data)
                setStores(storesRes.data.data)
            } catch {
                showToast('Failed to load data','error')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

  

    // ---- Persist draft on every change ----
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        storeId, supplierId, items, orderDate
    }))
}, [storeId, supplierId, items, orderDate])

    // ---- Flash new item highlight ----
    useEffect(() => {
        if (flashIndex >= 0) {
            const timer = setTimeout(() => setFlashIndex(-1), 600)
            return () => clearTimeout(timer)
        }
    }, [flashIndex])

    // ---- Focus product search after supplier selected ----
    useEffect(() => {
        if (supplierId && productSearchRef.current) {
            setTimeout(() => productSearchRef.current?.focus(), 100)
        }
    }, [supplierId])

    const handleStoreChange = (id) => {
        setStoreId(id)
        localStorage.setItem('default_store_id', id)
    }

  const getCostPrice = (product) => {
    return product.cost_price ?? product.price ?? 0
}

    const subtotal = items.reduce((total, item) => {
        const product = products.find(p => p.id === parseInt(item.product_id))
        if (!product || !item.quantity) return total
return total + (parseFloat(item.unit_price) || 0) * item.quantity
    }, 0)

  const grandTotal = subtotal

    const handleProductSelect = useCallback((product) => {
        setItems(prev => {
            const next = [...prev, {
                product_id: String(product.id),
                quantity: 1,
                warehouse_id: '',
                unit_type: 'base',
                unit_price:getCostPrice(product),
            }]
            setFlashIndex(next.length - 1)
            // Focus the qty input of the new row after render
            setTimeout(() => {
                const el = document.querySelector(`[data-qty="${next.length - 1}"]`)
                if (el) { el.focus(); el.select() }
            }, 50)
            return next
        })
    }, [])

    const removeItem = (index) => setItems(items.filter((_, i) => i !== index))

    const updateItem = (index, field, value) => {
        const updated = [...items]
        if (field === 'quantity' && value !== '') value = String(Math.floor(Number(value)) || 1)
        updated[index][field] = value
        setItems(updated)
    }

    // Enter on qty → focus warehouse
    const handleQtyKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const wh = document.querySelector(`[data-wh="${index}"]`)
            if (wh) wh.focus()
        }
    }

    // After warehouse select → focus back to product search
    const handleWhChange = (index, value) => {
        updateItem(index, 'warehouse_id', value)
        if (value && productSearchRef.current) {
            setTimeout(() => productSearchRef.current?.focus(), 50)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (items.length === 0) { showToast('Add at least one item.' , 'error'); return }
        if (!storeId) { showToast('Please select a store.' , 'error'); return }
        setSaving(true)
        try {
            await api.post('/purchase-orders', {
                store_id: parseInt(storeId),
                supplier_id:parseInt(supplierId),
                order_date:orderDate,
                items: items.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    warehouse_id: item.warehouse_id ? parseInt(item.warehouse_id) : null,
                    unit_type: item.unit_type ?? 'base',
                    unit_price:parseFloat(item.unit_price) || 0
                }))
            })
            sessionStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem('order_draft_date')
            navigate('/purchase-orders')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create order' , 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex items-center gap-4 mb-5">
                <BackButton label="Back to Orders" to="/purchase-orders" />
                <h2 className="text-2xl font-bold text-white">Create New Purchase Order</h2>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Store + Supplier row */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {!user.store_id && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Store</label>
                            <select
                                value={storeId}
                                onChange={e => handleStoreChange(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            >
                                <option value="">Select a store</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${user.store_id ? 'col-span-2' : ''}`}>
                        <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Supplier</label>
                       <SupplierSearchInput
    suppliers={suppliers}
    value={supplierId}
    onSelect={setSupplierId}
/>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
        Purchase Order Date
    </label>
    <input
        type="date"
        value={orderDate}
        max={new Date().toISOString().split('T')[0]}
        onChange={e => setOrderDate(e.target.value)}
        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
    />
</div>
                </div>

                {/* Main: items table (left) + sticky panel (right) */}
                <div className="flex gap-4 items-start">

                    {/* Items table */}
                    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden min-w-0">
                        <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-white text-sm font-semibold">
                                Items
                                {items.length > 0 && <span className="ml-1.5 text-gray-500 font-normal">({items.length})</span>}
                            </h3>
                            {items.length > 0 && (
                                <span className="text-xs text-gray-500">Enter = next field</span>
                            )}
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                Search or browse products to add items →
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        {['Product', 'Qty', 'Unit Price', 'Warehouse', 'Unit', 'Total', ''].map(h => (
                                            <th key={h} className="px-2.5 py-1.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/60">
                                    {items.map((item, index) => {
                                        const product = products.find(p => p.id === parseInt(item.product_id))
                                        const lineTotal = item.unit_price 
    ? parseFloat(item.unit_price) * (parseInt(item.quantity) || 0)
    : 0
                                        const isFlash = flashIndex === index

                                        return (
                                            <tr
                                                key={index}
                                                className={`transition-colors duration-500 ${isFlash ? 'bg-blue-600/15' : 'hover:bg-gray-800/30'}`}
                                            >
                                                <td className="px-2.5 py-1.5">
                                                    <p className="text-white text-sm leading-tight">{product?.name ?? '—'}</p>
                                                    {product?.sku && <p className="text-gray-500 text-[10px]">{product.sku}</p>}
                                                </td>
                                                <td className="px-2.5 py-1.5">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        data-qty={index}
                                                        value={item.quantity}
                                                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                                                        onKeyDown={e => handleQtyKeyDown(e, index)}
                                                        className="w-14 px-1.5 py-1 bg-gray-800 border border-gray-700 text-white rounded text-sm text-center focus:outline-none focus:border-blue-500"
                                                    />
                                                </td>
                                                <td className="px-2.5 py-1.5">
    <input
        type="number"
        min="0"
        step="0.01"
        value={item.unit_price}
        onChange={e => updateItem(index, 'unit_price', e.target.value)}
        className="w-20 px-1.5 py-1 bg-gray-800 border border-gray-700 text-white rounded text-sm text-center focus:outline-none focus:border-blue-500"
    />
</td>
                                                <td className="px-2.5 py-1.5">
                                                    <select
                                                        data-wh={index}
                                                        value={item.warehouse_id}
                                                        onChange={e => handleWhChange(index, e.target.value)}
                                                        required
                                                        className="w-full px-1.5 py-1 bg-gray-800 border border-gray-700 text-white rounded text-xs focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="">Select</option>
                                                       {warehouses
    .filter(w => !storeId || w.store_id === parseInt(storeId))
    .map(w => (
        <option key={w.id} value={w.id}>{w.name}</option>
    ))}
                                                    </select>
                                                </td>
                                                <td className="px-2.5 py-1.5">
                                                    {product?.secondary_unit ? (
                                                        <div className="flex gap-0.5">
                                                            {['base', 'secondary'].map(u => (
                                                                <button
                                                                    key={u}
                                                                    type="button"
                                                                    onClick={() => updateItem(index, 'unit_type', u)}
                                                                    className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                                                        item.unit_type === u ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                                                                    }`}
                                                                >
                                                                    {u === 'base' ? product.unit : product.secondary_unit}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs">{product?.unit ?? '—'}</span>
                                                    )}
                                                </td>
                                                <td className="px-2.5 py-1.5 text-white text-sm font-medium whitespace-nowrap">
                                                    {lineTotal} <span className="text-gray-500 text-[10px]">EGP</span>
                                                </td>
                                                <td className="px-2.5 py-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Sticky right panel */}
                    <div className="w-[340px] shrink-0 sticky top-4 space-y-3">

                        {/* Product search */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wider font-medium">Add Product</p>
                            <ProductSearchInput
                                products={products}
                                onSelect={handleProductSelect}
                                showCostPrice={true}
                                placeholder="Name or SKU..."
                                inputRef={productSearchRef}
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Summary</p>

                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Items</span>
                                <span className="text-white">{items.length}</span>
                            </div>

                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Subtotal</span>
                                <span className="text-white">{subtotal} EGP</span>
                            </div>

                            <div className="flex justify-between text-lg font-bold text-white border-t border-gray-800 pt-3">
                                <span>Total</span>
                                <span>{grandTotal} EGP</span>
                            </div>

                            <button
                                type="submit"
                                disabled={saving || items.length === 0 || !supplierId}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                                {saving ? 'Creating...' : 'Create Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}