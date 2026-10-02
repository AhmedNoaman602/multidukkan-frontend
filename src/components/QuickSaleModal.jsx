import { useState, useCallback, useRef } from "react";
import { useQuery } from '@tanstack/react-query'
import { useToast } from "../hooks/useToast";
import api from '../api/axios'
import ProductSearchInput from './ProductSearchInput'
import StockAvailability from './StockAvailability'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency } from '../lib/format'
import { useStoreAvailability, baseNeedsByProduct } from '../hooks/useStoreAvailability'

export default function QuickSaleModal({
    open,
    onClose,
    products,
    storeId,
}) {
    const [items, setItems] = useState([])
    const [saving, setSaving] = useState(false)
    const [manualTotal , setManualTotal] = useState(null)
    const [discount, setDiscount] = useState(0)
    const [discountType, setDiscountType] = useState('amount')
    const [pickedStoreId, setPickedStoreId] = useState(() => localStorage.getItem('default_store_id') || '')
    const { showToast } = useToast()
    const { t, lang } = useTranslation()
    const productSearchRef = useRef(null)

    // The sale comes from a store's shelf: the user's own store, or the one an admin picks.
    const { data: stores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: () => api.get('/stores').then(res => res.data.data),
        enabled: open && !storeId,
    })
    const saleStoreId = storeId || pickedStoreId || (stores.length === 1 ? String(stores[0].id) : '')

    const availability = useStoreAvailability(open ? saleStoreId : null, items.map(i => i.product_id))
    const needs = baseNeedsByProduct(items, products || [])
    const productOf = (item) => (products || []).find(p => p.id === parseInt(item.product_id))

    const handleProductSelect = useCallback((product) => {
    setItems(prev => {
        const next = [...prev, {
            product_id: String(product.id),
            product_name: product.name,
            unit_price: product.price,
            quantity: 1,
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

    const handleQtyKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            productSearchRef.current?.focus()
        }
    }

    const subtotal = items.reduce((sum, item) =>
        sum + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0), 0
    )

    const discountAmount = discountType === 'percent'
        ? Math.round(subtotal * (parseFloat(discount) || 0) / 100 * 100) / 100
        : parseFloat(discount) || 0

    const grandTotal = Math.max(0, subtotal - discountAmount)

    const hasManualTotal = manualTotal !== null && manualTotal !== ''

    const handleSubmit = async () => {
           const user = JSON.parse(localStorage.getItem('user') || '{}')

    if (!user.walk_in_customer_id) {
        showToast(t('quickSale.walkInCustomerError'), 'error')
        return
    }
        if (items.length === 0) {
            showToast(t('orders.create.itemRequired'), 'error')
            return
        }
        if (!saleStoreId) {
            showToast(t('quickSale.storeRequired'), 'error')
            return
        }
        setSaving(true)
        try {
            const res = await api.post('/orders', {
                customer_id: user.walk_in_customer_id,
                store_id: parseInt(saleStoreId),
                order_date: new Date().toLocaleDateString('en-CA'),
                discount: hasManualTotal ? 0 : parseFloat(discount) || 0,
                discount_type: discountType,
                ...(hasManualTotal && { manual_total: parseFloat(manualTotal) }),
                pay_immediately: true,
                payment_method: 'cash',
                items: items.map(i => ({
                    product_id: parseInt(i.product_id),
                    quantity: parseInt(i.quantity),
                    unit_type: i.unit_type ?? 'base',
                    unit_price: parseFloat(i.unit_price),
                }))
            })
showToast(t('quickSale.saleRecorded'), 'success')
setItems([])
setDiscount(0)
setManualTotal(null)
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
                    {!storeId && stores.length > 1 && (
                        <select
                            value={saleStoreId}
                            onChange={e => {
                                setPickedStoreId(e.target.value)
                                localStorage.setItem('default_store_id', e.target.value)
                            }}
                            className="w-full mb-2 px-2 py-1.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-xs focus:outline-none focus:border-blue-500"
                        >
                            <option value="">{t('orders.create.chooseStore')}</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
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
                                    {['common.product', 'common.quantity', 'quickSale.price', 'common.total', ''].map(key => (
                                        <th key={key || 'actions'} className="px-2 py-1.5 text-start text-[10px] font-medium text-gray-500 uppercase">{key ? t(key) : ''}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-2 py-1.5">
                                            <p className="text-white text-xs font-medium leading-tight">{item.product_name}</p>
                                            <StockAvailability availability={availability[item.product_id]} product={productOf(item)} needed={needs[item.product_id]} />
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <input
                                                type="number"
                                                min="1"
                                                data-qs-qty={index}
                                                value={item.quantity}
                                                onChange={e => updateItem(index, 'quantity', e.target.value)}
                                                onKeyDown={handleQtyKeyDown}
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
                                        <div className="min-w-0">
                                            <p className="text-white text-xs font-medium leading-tight truncate">{item.product_name}</p>
                                            <StockAvailability availability={availability[item.product_id]} product={productOf(item)} needed={needs[item.product_id]} />
                                        </div>
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
                                            onKeyDown={handleQtyKeyDown}
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
                                        disabled={hasManualTotal}
                                        onClick={() => setDiscountType(mode)}
                                        className={`px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
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
                                value={hasManualTotal ? 0 : discount}
                                disabled={hasManualTotal}
                                onChange={e => setDiscount(e.target.value)}
                                className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 text-white rounded-lg text-xs text-end focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
