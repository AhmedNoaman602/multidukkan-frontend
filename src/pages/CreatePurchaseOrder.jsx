import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import ProductSearchInput from '../components/ProductSearchInput'
import SupplierSearchInput from '../components/SupplierSearchInput'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { formatNumber } from '../lib/format'
const STORAGE_KEY = 'createPurchaseOrderDraft'

export default function CreatePurchaseOrder() {
    const [saving, setSaving] = useState(false)
    const [flashIndex, setFlashIndex] = useState(-1)
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const productSearchRef = useRef(null)

    const {showToast} = useToast()
    const { t, dir } = useTranslation()
    // The empty-state hint points toward the product-search panel, which
    // sits at the flex-end side (opposite the reading-start edge).
    const HintIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    // ---- Form state (restored from draft) ----
    const draft = (() => {
        try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {} }
        catch { return {} }
    })()


    const [storeId, setStoreId] = useState(draft.storeId || '')
    const [supplierId, setSupplierId] = useState(draft.supplierId || '')

    const [items, setItems] = useState(draft.items || [])

    const [pricedForSupplier, setPricedForSupplier] = useState(supplierId)

    useEffect(() => {
    if (items.length === 0) {
        setPricedForSupplier(supplierId)
    }
}, [items.length])

const supplierChanged = items.length > 0 && supplierId !== pricedForSupplier

    const [orderDate, setOrderDate] = useState(() => {
        const today = new Date().toLocaleDateString('en-CA')
        const saved = localStorage.getItem('order_draft_date')
        return saved || today
    })

    useEffect(() => {
        localStorage.setItem('order_draft_date', orderDate)
    }, [orderDate])

    // Fetch data
    const { data: suppliers = [], isLoading: suppliersLoading, isError: suppliersError } = useQuery({
        queryKey: ['suppliers', 'all'],
        queryFn: () => api.get('/suppliers').then(res => res.data.data),
    })
    const { data: products = [], isLoading: productsLoading, isError: productsError } = useQuery({
        queryKey: ['products', 'all'],
        queryFn: () => api.get('/products?per_page=all').then(res => res.data.data),
    })
    const { data: warehouses = [], isLoading: warehousesLoading, isError: warehousesError } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => api.get('/warehouses').then(res => res.data.data),
    })
    const { data: stores = [], isLoading: storesLoading, isError: storesError } = useQuery({
        queryKey: ['stores'],
        queryFn: () => api.get('/stores').then(res => res.data.data),
    })

    const loading = suppliersLoading || productsLoading || warehousesLoading || storesLoading
    const loadError = suppliersError || productsError || warehousesError || storesError

    useEffect(() => {
        if (loadError) showToast(t('orders.create.loadFailed'), 'error')
    }, [loadError, showToast, t])

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

    const { data: supplierProducts = [] } = useQuery({
        queryKey: ['suppliers', supplierId, 'products'],
        queryFn: () => api.get(`/suppliers/${supplierId}/products`).then(res => res.data.data.products || []),
        enabled: !!supplierId,
    })



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
    const supplierProduct = supplierProducts.find(sp => sp.id === product.id)
    const supplierCost = supplierProduct?.cost_price ?? supplierProduct?.last_purchase_price
    return supplierCost ?? product.cost_price ?? product.price ?? 0
}

    const subtotal = items.reduce((total, item) => {
        const product = products.find(p => p.id === parseInt(item.product_id))
        if (!product || !item.quantity) return total
return total + (parseFloat(item.unit_price) || 0) * item.quantity
    }, 0)

  const grandTotal = subtotal

    const itemsWithTotals = items.map((item, index) => {
        const product = products.find(p => p.id === parseInt(item.product_id))
        const lineTotal = item.unit_price
            ? parseFloat(item.unit_price) * (parseInt(item.quantity) || 0)
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
    }, [supplierProducts])

    const productsWithSupplierPricing = products.map(product => {
    const supplierProduct = supplierProducts.find(sp => sp.id === product.id)
    const supplierCost = supplierProduct?.cost_price ?? supplierProduct?.last_purchase_price
    return {
        ...product,
        cost_price: supplierCost ?? product.cost_price
    }
})

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
        if (items.length === 0) { showToast(t('purchaseOrders.create.itemRequired'), 'error'); return }
        if (!storeId) { showToast(t('purchaseOrders.create.storeRequired'), 'error'); return }
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
            showToast(err.response?.data?.message || t('purchaseOrders.create.createFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex items-center gap-4 mb-5">
                <BackButton label={t('purchaseOrders.create.backToOrders')} to="/purchase-orders" />
                <h2 className="text-2xl font-bold text-white">{t('purchaseOrders.create.title')}</h2>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Store + Supplier row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {!user.store_id && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">{t('common.store')}</label>
                            <select
                                value={storeId}
                                onChange={e => handleStoreChange(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            >
                                <option value="">{t('orders.create.chooseStore')}</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${user.store_id ? 'col-span-2' : ''}`}>
                        <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-700 text-gray-300 text-[10px] normal-case">2</span>
                            {t('orders.create.addProduct')}
                        </label>
                        <ProductSearchInput
                            products={productsWithSupplierPricing}
                            onSelect={handleProductSelect}
                            showCostPrice={true}
                            inputRef={productSearchRef}
                            disabled={!supplierId}
                            placeholder={!supplierId ? t('purchaseOrders.create.selectSupplierFirst') : undefined}
                        />
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
        {t('purchaseOrders.create.orderDate')}
    </label>
    <input
        type="date"
        value={orderDate}
        max={new Date().toLocaleDateString('en-CA')}
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
                                {items.length > 0 ? t('orders.create.itemsCount', { count: items.length }) : t('orders.create.items')}
                            </h3>
                            {items.length > 0 && (
                                <span className="text-xs text-gray-500">{t('orders.create.nextField')}</span>
                            )}
                        </div>
                        {supplierChanged && (
    <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-start sm:items-center justify-between gap-2">
        <span className="text-yellow-400 text-xs">
            {t('purchaseOrders.create.supplierChanged')}
        </span>
      <button
    onClick={() => setPricedForSupplier(supplierId)}
    className="text-yellow-400 hover:text-yellow-300 text-xs shrink-0"
>
    ✕
</button>
    </div>
)}

                        {items.length === 0 ? (
                            <div className="flex items-center justify-center gap-1 py-10 text-gray-500 text-sm">
                                {t('orders.create.addItemsHint')}
                                <HintIcon size={14} />
                            </div>
                        ) : (
                            <>
                            {/* Desktop table */}
                            <table className="w-full hidden md:table">
                                <thead className="bg-gray-800">
                                    <tr>
                                        {['common.product', 'common.quantity', 'orders.unitPrice', 'common.warehouse', 'orders.create.unit', 'common.total', null].map(key => (
                                            <th key={key ?? 'actions'} className="px-2.5 py-1.5 text-start text-[11px] font-medium text-gray-400 uppercase tracking-wider">{key ? t(key) : ''}</th>
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
                                                        <option value="">{t('orders.create.chooseWarehouse')}</option>
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
                                                    {formatNumber(lineTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-gray-500 text-[10px]">{t('common.currency')}</span>
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
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={e => updateItem(index, 'unit_price', e.target.value)}
                                                    className="w-16 shrink-0 px-1.5 py-1.5 bg-gray-800 border border-gray-700 text-white rounded text-sm text-center focus:outline-none focus:border-blue-500"
                                                />
                                                <select
                                                    data-wh={index}
                                                    value={item.warehouse_id}
                                                    onChange={e => handleWhChange(index, e.target.value)}
                                                    required
                                                    className="flex-1 min-w-0 px-1.5 py-1.5 bg-gray-800 border border-gray-700 text-white rounded text-xs focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="">{t('products.form.chooseWarehouse')}</option>
                                                    {warehouses
                                                        .filter(w => !storeId || w.store_id === parseInt(storeId))
                                                        .map(w => (
                                                            <option key={w.id} value={w.id}>{w.name}</option>
                                                        ))}
                                                </select>
                                                {product?.secondary_unit ? (
                                                    <div className="flex gap-0.5 shrink-0">
                                                        {['base', 'secondary'].map(u => (
                                                            <button
                                                                key={u}
                                                                type="button"
                                                                onClick={() => updateItem(index, 'unit_type', u)}
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
                                                {formatNumber(lineTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-gray-500 text-[10px]">{t('common.currency')}</span>
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

                        {/* Supplier search */}
                        <div id="supplier-panel" className="bg-gray-900 border border-gray-800 rounded-xl p-4 scroll-mt-20">
                            <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2 uppercase tracking-wider font-medium">
                                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] normal-case">1</span>
                                {t('common.supplier')}
                            </p>
                            <SupplierSearchInput
                                suppliers={suppliers}
                                value={supplierId}
                                onSelect={setSupplierId}
                                autoFocus
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2.5">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{t('orders.create.summary')}</p>

                            <div className="flex justify-between text-sm text-gray-400">
                                <span>{t('common.items')}</span>
                                <span className="text-white">{items.length}</span>
                            </div>

                            <div className="flex justify-between text-sm text-gray-400">
                                <span>{t('orders.subtotal')}</span>
                                <span className="text-white">{formatNumber(subtotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('common.currency')}</span>
                            </div>

                            <div className="flex justify-between text-lg font-bold text-white border-t border-gray-800 pt-3">
                                <span>{t('common.total')}</span>
                                <span>{formatNumber(grandTotal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('common.currency')}</span>
                            </div>

                            <button
                                type="submit"
                                disabled={saving || items.length === 0 || !supplierId}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                                {saving ? t('purchaseOrders.create.creating') : t('purchaseOrders.create.submit')}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

        </div>
    )
}