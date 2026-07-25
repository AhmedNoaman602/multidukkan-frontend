import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import ProductSearchInput from '../components/ProductSearchInput'
import CustomerSearchInput from '../components/CustomerSearchInput'
import { useToast } from '../hooks/useToast'
const STORAGE_KEY = 'createOrderDraft'

export default function CreateOrder() {
    const [warehouses, setWarehouses] = useState([])
    const [inventory, setInventory] = useState([])
    const [customers, setCustomers] = useState([])
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
    const [customerId, setCustomerId] = useState(draft.customerId || '')
    const [items, setItems] = useState(draft.items || [])
    const [discountValue, setDiscountValue] = useState(draft.discountValue || 0)
    const [discountType, setDiscountType] = useState(draft.discountType || 'amount')

    const [orderDate, setOrderDate] = useState(() => {
       return new Date().toISOString().split('T')[0]
    })
  
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
                const [customersRes, productsRes, warehousesRes, inventoryRes, storesRes] = await Promise.all([
                    api.get('/customers'),
                    api.get('/products?per_page=all'),
                    api.get('/warehouses'),
                    api.get('/inventory?per_page=all'),
                    api.get('/stores'),
                ])
                setCustomers(customersRes.data.data)
                setProducts(productsRes.data.data)
                setWarehouses(warehousesRes.data.data)
                setInventory(inventoryRes.data.data)
                setStores(storesRes.data.data)
            } catch {
                showToast('حصلت مشكلة في تحميل البيانات', 'error')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

  

    // ---- Persist draft on every change ----
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            storeId, customerId, items, discountValue, discountType,orderDate
        }))
    }, [storeId, customerId, items, discountValue, discountType,orderDate])

    // ---- Flash new item highlight ----
    useEffect(() => {
        if (flashIndex >= 0) {
            const timer = setTimeout(() => setFlashIndex(-1), 600)
            return () => clearTimeout(timer)
        }
    }, [flashIndex])

    // ---- Focus product search after customer selected ----
    useEffect(() => {
        if (customerId && productSearchRef.current) {
            setTimeout(() => productSearchRef.current?.focus(), 100)
        }
    }, [customerId])

    const handleStoreChange = (id) => {
        setStoreId(id)
        localStorage.setItem('default_store_id', id)
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

    const getAvailableStock = (warehouseId, productId, currentIndex) => {
        const inventoryRow = inventory.find(
            inv => inv.warehouse_id === warehouseId && inv.product_id === productId
        )
        const available = inventoryRow ? inventoryRow.quantity : 0
        const committed = items.reduce((sum, item, idx) => {
            if (idx !== currentIndex && parseInt(item.product_id) === productId && parseInt(item.warehouse_id) === warehouseId)
                return sum + (parseInt(item.quantity) || 0)
            return sum
        }, 0)
        return Math.max(0, available - committed)
    }

    const subtotal = items.reduce((total, item) => {
        const product = products.find(p => p.id === parseInt(item.product_id))
        if (!product || !item.quantity) return total
        return total + getUnitPrice(product, item.unit_type) * item.quantity
    }, 0)

    const discountAmount = discountType === 'percent'
        ? Math.round(subtotal * (parseFloat(discountValue) || 0) / 100 * 100) / 100
        : parseFloat(discountValue) || 0

    const grandTotal = Math.max(0, subtotal - discountAmount)

    const itemsWithTotals = items.map((item, index) => {
        const product = products.find(p => p.id === parseInt(item.product_id))
        const lineTotal = product
            ? getUnitPrice(product, item.unit_type) * (parseInt(item.quantity) || 0)
            : 0
        return { item, index, product, lineTotal }
    })

    const handleProductSelect = useCallback((product) => {
        setItems(prev => {
            const next = [...prev, {
                product_id: String(product.id),
                quantity: 1,
                warehouse_id: '',
                unit_type: 'base',
                unit_price: getPriceForCustomer(product)
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
        if (items.length === 0) { showToast('ضيف صنف واحد على الأقل.', 'error'); return }
        if (!storeId) { showToast('من فضلك اختر المتجر.', 'error'); return }
        if (!customerId) { showToast('من فضلك اختر العميل.', 'error'); return }
        setSaving(true)
        try {
            await api.post('/orders', {
                store_id: parseInt(storeId),
                customer_id: parseInt(customerId),
                discount: discountAmount,
                order_date:orderDate,
                items: items.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    warehouse_id: item.warehouse_id ? parseInt(item.warehouse_id) : null,
                    unit_type: item.unit_type ?? 'base',
                }))
            })
            sessionStorage.removeItem(STORAGE_KEY)
            showToast('تم إنشاء الطلب بنجاح.', 'success')
            navigate('/orders')
        } catch (err) {
            showToast(err.response?.data?.message || 'حصلت مشكلة في إنشاء الطلب', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex items-center gap-4 mb-5">
                <BackButton label="رجوع للطلبات" to="/orders" />
                <h2 className="text-2xl font-bold text-white">إنشاء طلب جديد</h2>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Store + Customer row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {!user.store_id && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">المتجر</label>
                            <select
                                value={storeId}
                                onChange={e => handleStoreChange(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            >
                                <option value="">اختر المتجر</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${user.store_id ? 'col-span-2' : ''}`}>
                        <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">العميل</label>
                        <CustomerSearchInput
                            customers={customers}
                            value={customerId}
                            onSelect={setCustomerId}
                        />
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
        تاريخ الطلب
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
                <div className="flex flex-col lg:flex-row gap-4 items-start">

                    {/* Items table */}
                    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto min-w-0">
                        <div className="px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-white text-sm font-semibold">
                                الأصناف
                                {items.length > 0 && <span className="ms-1.5 text-gray-500 font-normal">({items.length})</span>}
                            </h3>
                            {items.length > 0 && (
                                <span className="text-xs text-gray-500">Enter = الحقل التالي</span>
                            )}
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                ابحث أو اتصفح المنتجات عشان تضيف أصناف ←
                            </div>
                        ) : (
                            <>
                            {/* Desktop table */}
                            <table className="w-full hidden md:table">
                                <thead className="bg-gray-800">
                                    <tr>
                                        {['المنتج', 'الكمية', 'السعر', 'المخزن', 'الوحدة', 'الإجمالي', ''].map(h => (
                                            <th key={h} className="px-2.5 py-1.5 text-start text-[11px] font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/60">
                                    {itemsWithTotals.map(({ item, index, product, lineTotal }) => {
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
                                                        <option value="">اختر</option>
                                                        {warehouses
                                                            .filter(w => !storeId || w.store_id === parseInt(storeId))
                                                            .map(w => {
                                                                const qty = getAvailableStock(w.id, parseInt(item.product_id), index)
                                                                return <option key={w.id} value={w.id}>{w.name} ({qty})</option>
                                                            })}
                                                    </select>
                                                </td>
                                                <td className="px-2.5 py-1.5">
                                                    {product?.secondary_unit ? (
                                                        <div className="flex gap-0.5">
                                                            {['base', 'secondary'].map(u => (
                                                                <button
                                                                    key={u}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        updateItem(index, 'unit_type', u)
                                                                        updateItem(index, 'unit_price', getUnitPrice(product, u))
                                                                    }}
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
                                                    {lineTotal.toFixed(2)} <span className="text-gray-500 text-[10px]">ج.م</span>
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

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-gray-800/60">
                                {itemsWithTotals.map(({ item, index, product, lineTotal }) => {
                                    const isFlash = flashIndex === index

                                    return (
                                        <div
                                            key={index}
                                            className={`p-3 space-y-2 transition-colors duration-500 ${isFlash ? 'bg-blue-600/15' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-white text-sm leading-tight truncate">{product?.name ?? '—'}</p>
                                                    {product?.sku && <p className="text-gray-500 text-[10px] truncate">{product.sku}</p>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-gray-600 hover:text-red-400 transition-colors text-sm shrink-0"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    data-qty={index}
                                                    value={item.quantity}
                                                    onChange={e => updateItem(index, 'quantity', e.target.value)}
                                                    onKeyDown={e => handleQtyKeyDown(e, index)}
                                                    className="w-14 shrink-0 px-1.5 py-1.5 bg-gray-800 border border-gray-700 text-white rounded text-sm text-center focus:outline-none focus:border-blue-500"
                                                />
                                                <select
                                                    data-wh={index}
                                                    value={item.warehouse_id}
                                                    onChange={e => handleWhChange(index, e.target.value)}
                                                    required
                                                    className="flex-1 min-w-0 px-1.5 py-1.5 bg-gray-800 border border-gray-700 text-white rounded text-xs focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="">اختر المخزن</option>
                                                    {warehouses
                                                        .filter(w => !storeId || w.store_id === parseInt(storeId))
                                                        .map(w => {
                                                            const qty = getAvailableStock(w.id, parseInt(item.product_id), index)
                                                            return <option key={w.id} value={w.id}>{w.name} ({qty})</option>
                                                        })}
                                                </select>
                                                {product?.secondary_unit ? (
                                                    <div className="flex gap-0.5 shrink-0">
                                                        {['base', 'secondary'].map(u => (
                                                            <button
                                                                key={u}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateItem(index, 'unit_type', u)
                                                                    updateItem(index, 'unit_price', getUnitPrice(product, u))
                                                                }}
                                                                className={`px-1.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                                                    item.unit_type === u ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                                                                }`}
                                                            >
                                                                {u === 'base' ? product.unit : product.secondary_unit}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-xs shrink-0">{product?.unit ?? '—'}</span>
                                                )}
                                            </div>

                                            <p className="text-end text-white text-sm font-medium">
                                                {lineTotal.toFixed(2)} <span className="text-gray-500 text-[10px]">ج.م</span>
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                            </>
                        )}
                    </div>

                    {/* Sticky right panel */}
                    <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-4 space-y-3">

                        {/* Product search */}
                        <div id="add-product-panel" className="bg-gray-900 border border-gray-800 rounded-xl p-4 scroll-mt-20">
                            <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wider font-medium">إضافة منتج</p>
                            <ProductSearchInput
                                products={products}
                                onSelect={handleProductSelect}
                                placeholder="الاسم أو رمز المنتج..."
                                inputRef={productSearchRef}
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">الملخص</p>

                            <div className="flex justify-between text-sm text-gray-400">
                                <span>الأصناف</span>
                                <span className="text-white">{items.length}</span>
                            </div>

                            <div className="flex justify-between text-sm text-gray-400">
                                <span>الإجمالي الفرعي</span>
                                <span className="text-white">{subtotal.toFixed(2)} ج.م</span>
                            </div>

                            {/* Discount */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">الخصم</span>
                                    <div className="flex rounded-lg overflow-hidden border border-gray-700">
                                        {['amount', 'percent'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setDiscountType(t)}
                                                className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                                                    discountType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                            >
                                                {t === 'amount' ? 'ج.م' : '%'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max={discountType === 'percent' ? 100 : undefined}
                                        value={discountValue}
                                        onChange={e => setDiscountValue(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm pe-10"
                                        placeholder="0"
                                    />
                                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">
                                        {discountType === 'percent' ? '%' : 'ج.م'}
                                    </span>
                                </div>
                                {discountType === 'percent' && discountAmount > 0 && (
                                    <p className="text-green-400 text-xs">= خصم {discountAmount} ج.م</p>
                                )}
                            </div>

                            <div className="flex justify-between text-lg font-bold text-white border-t border-gray-800 pt-3">
                                <span>الإجمالي</span>
                                <span>{grandTotal.toFixed(2)} ج.م</span>
                            </div>

                            <button
                                type="submit"
                                disabled={saving || items.length === 0 || !customerId}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                                {saving ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

        </div>
    )
}