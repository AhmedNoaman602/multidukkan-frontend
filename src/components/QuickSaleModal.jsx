import { useState, useCallback, useRef } from "react";
import { useToast } from "../hooks/useToast";
import api from '../api/axios'
import ProductSearchInput from './ProductSearchInput'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency } from '../lib/format'

export default function QuickSaleModal({
    open,
    onClose,
    products,
    warehouses,
    inventory,
    storeId,
}) {
    const [items, setItems] = useState([])
    const [saving, setSaving] = useState(false)
    const [manualTotal , setManualTotal] = useState(null)
    const [discount, setDiscount] = useState(0)
    const [discountType, setDiscountType] = useState('amount')
    const { showToast } = useToast()
    const { t, lang } = useTranslation()
    const productSearchRef = useRef(null)


    const getStock = (warehouseId, productId) => {
        if (!productId || !warehouseId) return 0
        const inv = (inventory || []).find(i =>
            i.warehouse_id === parseInt(warehouseId) &&
            i.product_id === parseInt(productId)
        )
        return inv ? inv.quantity : 0
    }

    const handleProductSelect = useCallback((product) => {
    setItems(prev => {
        const next = [...prev, {
            product_id: String(product.id),
            product_name: product.name,
            unit_price: product.price,
            quantity: 1,
            warehouse_id: '',
            unit_type: 'base',
        }]
        setTimeout(() => {
            const el = document.querySelector(`[data-qs-qty="${next.length - 1}"]`)
            if (el) { el.focus(); el.select() }
        }, 50)
        return next
    })
}, [])

    const updateItem = (index, field, value) => {
        const updated = [...items]
        updated[index][field] = value
        setItems(updated)
    }

    const removeItem = (index) => setItems(items.filter((_, i) => i !== index))

    const handleQtyKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const wh = document.querySelector(`[data-qs-wh="${index}"]`)
            if (wh) wh.focus()
        }
    }

    const handleWhChange = (index, value) => {
        updateItem(index, 'warehouse_id', value)
        if (value && productSearchRef.current) {
            setTimeout(() => productSearchRef.current?.focus(), 50)
        }
    }

    const subtotal = items.reduce((sum, item) =>
        sum + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0), 0
    )

    const discountAmount = discountType === 'percent'
        ? Math.round(subtotal * (parseFloat(discount) || 0) / 100 * 100) / 100
        : parseFloat(discount) || 0

    const grandTotal = Math.max(0, subtotal - discountAmount)

    const finalTotal = manualTotal !== null && manualTotal !== ''
    ? parseFloat(manualTotal)
    : grandTotal

    const handleSubmit = async () => {
           const user = JSON.parse(localStorage.getItem('user') || '{}')

    if (!user.walk_in_customer_id) {
        showToast(t('quickSale.walkInCustomerError'), 'error')
        return
    }
        const resolvedStoreId = storeId || user.store_id

        if (items.length === 0) {
            showToast(t('orders.create.itemRequired'), 'error')
            return
        }
        const missingWarehouse = items.some(i => !i.warehouse_id)
        if (missingWarehouse) {
            showToast(t('quickSale.warehouseRequiredAll'), 'error')
            return
        }
        // Resolve store_id from the selected warehouse of the first item
        const firstWarehouseId = parseInt(items[0].warehouse_id)
        const selectedWarehouse = warehouses.find(w => w.id === firstWarehouseId)
        const finalStoreId = resolvedStoreId || (selectedWarehouse ? selectedWarehouse.store_id : null)

        if (!finalStoreId) {
            showToast(t('quickSale.storeResolveFailed'), 'error')
            return
        }
        setSaving(true)
        try {
            const res = await api.post('/orders', {
                customer_id: user.walk_in_customer_id,
                store_id: finalStoreId,
                order_date: new Date().toISOString().split('T')[0],
                discount: discountAmount,
                pay_immediately: true,
                payment_method: 'cash',
                items: items.map(i => ({
                    product_id: parseInt(i.product_id),
                    quantity: parseInt(i.quantity),
                    warehouse_id: parseInt(i.warehouse_id),
                    unit_type: i.unit_type ?? 'base',
                    unit_price: parseFloat(i.unit_price),
                }))
            })
showToast(t('quickSale.saleRecorded'), 'success')
setItems([])
setDiscount(0)
try {
    onClose()
} catch(e) {
    showToast(t('quickSale.closeFailed'), 'error')
}
        } catch (err) {
            showToast(err.response?.data?.message || t('orders.create.createFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800">
                    <div>
                        <h3 className="text-white font-bold">{t('quickSale.title')}</h3>
                        <p className="text-gray-500 text-xs">{t('quickSale.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
                </div>

                {/* Product Search */}
                <div className="px-4 py-3 border-b border-gray-800">
                    <ProductSearchInput
                        products={products}
                        onSelect={handleProductSelect}
                        placeholder={t('quickSale.searchPlaceholder')}
                        inputRef={productSearchRef}
                    />
                    {items.length > 0 && (
                        <p className="text-gray-600 text-xs mt-1.5">{t('quickSale.hint')}</p>
                    )}
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            {t('quickSale.emptyState')}
                        </div>
                    ) : (
                        <>
                        {/* Desktop table */}
                        <div className="overflow-x-auto hidden md:block">
                        <table className="w-full">
                            <thead className="bg-gray-800 sticky top-0">
                                <tr>
                                    {['common.product', 'common.quantity', 'quickSale.price', 'common.warehouse', 'common.total', ''].map(key => (
                                        <th key={key || 'actions'} className="px-2 py-1.5 text-start text-[10px] font-medium text-gray-500 uppercase">{key ? t(key) : ''}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-2 py-1.5">
                                            <p className="text-white text-xs font-medium leading-tight">{item.product_name}</p>
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input
                                                type="number"
                                                min="1"
                                                data-qs-qty={index}
                                                value={item.quantity}
                                                onChange={e => updateItem(index, 'quantity', e.target.value)}
                                                onKeyDown={e => handleQtyKeyDown(e, index)}
                                                className="w-12 px-1 py-1 bg-gray-800 border border-gray-700 text-white rounded text-xs text-center focus:outline-none focus:border-blue-500"
                                            />
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={e => updateItem(index, 'unit_price', e.target.value)}
                                                className="w-16 px-1 py-1 bg-gray-800 border border-gray-700 text-white rounded text-xs text-center focus:outline-none focus:border-blue-500"
                                            />
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <select
                                                data-qs-wh={index}
                                                value={item.warehouse_id}
                                                onChange={e => handleWhChange(index, e.target.value)}
                                                className="w-full px-1 py-1 bg-gray-800 border border-gray-700 text-white rounded text-xs focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="">{t('orders.create.chooseWarehouse')}</option>
                                                {warehouses.map(w => {
                                                    const stock = getStock(w.id, item.product_id)
                                                    return (
                                                        <option key={w.id} value={w.id}>
                                                            {w.name} ({stock})
                                                        </option>
                                                    )
                                                })}
                                            </select>
                                        </td>
                                        <td className="px-2 py-1.5 text-white text-xs font-medium whitespace-nowrap">
                                            {formatCurrency((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0), lang)}
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                                            >✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-800/60">
                            {items.map((item, index) => (
                                <div key={index} className="p-2.5 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-white text-xs font-medium leading-tight truncate min-w-0">{item.product_name}</p>
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-gray-600 hover:text-red-400 transition-colors text-sm shrink-0"
                                        >✕</button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            min="1"
                                            data-qs-qty={index}
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', e.target.value)}
                                            onKeyDown={e => handleQtyKeyDown(e, index)}
                                            className="w-12 shrink-0 px-1 py-1.5 bg-gray-800 border border-gray-700 text-white rounded text-xs text-center focus:outline-none focus:border-blue-500"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.unit_price}
                                            onChange={e => updateItem(index, 'unit_price', e.target.value)}
                                            className="w-16 shrink-0 px-1 py-1.5 bg-gray-800 border border-gray-700 text-white rounded text-xs text-center focus:outline-none focus:border-blue-500"
                                        />
                                        <select
                                            data-qs-wh={index}
                                            value={item.warehouse_id}
                                            onChange={e => handleWhChange(index, e.target.value)}
                                            className="flex-1 min-w-0 px-1 py-1.5 bg-gray-800 border border-gray-700 text-white rounded text-xs focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">{t('orders.create.chooseWarehouse')}</option>
                                            {warehouses.map(w => {
                                                const stock = getStock(w.id, item.product_id)
                                                return (
                                                    <option key={w.id} value={w.id}>
                                                        {w.name} ({stock})
                                                    </option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                    <p className="text-end text-white text-xs font-medium">
                                        {formatCurrency((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0), lang)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-800 space-y-2.5">

                    {/* Discount */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-400 text-xs">{t('quickSale.discount')}</span>
                        <div className="flex items-center gap-1.5">
                            <div className="flex rounded-lg overflow-hidden border border-gray-700">
                                {['amount', 'percent'].map(mode => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setDiscountType(mode)}
                                        className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                                            discountType === mode ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                                        }`}
                                    >
                                        {mode === 'amount' ? t('common.currency') : '%'}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={discount}
                                onChange={e => setDiscount(e.target.value)}
                                className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 text-white rounded-lg text-xs text-end focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

               <div className="flex justify-between items-center">
    <span className="text-gray-400 text-sm">{t('common.total')}</span>
    <div className="text-end">
        <input
            type="number"
            min="0"
            step="0.01"
            value={manualTotal ?? ''}
            onChange={e => setManualTotal(e.target.value)}
            placeholder={grandTotal.toFixed(2)}
            className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm text-end focus:outline-none focus:border-blue-500"
        />
        <p className="text-gray-500 text-[10px] mt-0.5">
            {t('quickSale.autoCalculated', { amount: formatCurrency(grandTotal, lang) })}
        </p>
    </div>
</div>

                    <button
                        onClick={handleSubmit}
                        disabled={saving || items.length === 0}
                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-sm"
                    >
                        {saving ? t('quickSale.recording') : t('quickSale.collectCash')}
                    </button>
                </div>
            </div>
        </div>
    )
}
