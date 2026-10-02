import { useState , useEffect } from 'react'
import ProductSearchInput from './ProductSearchInput'
import {useToast} from '../hooks/useToast'
import api from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency } from '../lib/format'
import StockAvailability from './StockAvailability'
import { useStoreAvailability, baseNeedsByProduct } from '../hooks/useStoreAvailability'

export default function AddItemModal({ open, onClose,orderId, storeId, onSuccess }) {
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [products,setProducts] = useState([])
    const [saving, setSaving] = useState(false)
    const [loadingData, setLoadingData] = useState(false)
    const {showToast} = useToast()
    const { t, lang } = useTranslation()

    const [form, setForm] = useState({
        product_id: '',
        quantity: 1,
        unit_type: 'base',
        unit_price: '',
    })

    useEffect(() => {
       if (!open) return
       api.get('/products?per_page=all')
    .then(productsRes => setProducts(productsRes.data.data))
    .catch(err => showToast(err.response?.data?.message || t('orders.create.loadFailed'), 'error'))
    },[open , orderId])

    // The added line is sold from the order's store shelf; this only previews what the store holds.
    const availability = useStoreAvailability(open ? storeId : null, form.product_id ? [form.product_id] : [])
    const needed = baseNeedsByProduct(form.product_id ? [form] : [], products)[parseInt(form.product_id)]

    const handleProductSelect = (product) => {
        setSelectedProduct(product)
        setForm(f => ({
            ...f,
            product_id: String(product.id),
            unit_price: product.price ?? '',
        }))
    }

    const handleClose = () => {
        setSelectedProduct(null)
        setForm({ product_id: '', quantity: 1, unit_type: 'base', unit_price: '' })
        onClose()
    }

    const handleSave = async() => {
        setSaving(true)
        try{
            await api.post(`/orders/${orderId}/items` , {
                product_id:form.product_id,
                unit_price:form.unit_price,
                unit_type:form.unit_type,
                quantity:form.quantity,
            })
            showToast(t('orders.addItemModal.added'), 'success')
            onSuccess()
            handleClose()
        } catch (err) {
    showToast(err.response?.data?.message || t('orders.addItemModal.addFailed'), 'error')
} finally {
    setSaving(false)
}
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">{t('orders.addItemModal.title')}</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white text-lg">✕</button>
                </div>

                {/* Product Search */}
                <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1">{t('common.product')}</label>
                    {selectedProduct && (
                        <div className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-2">
                            <div>
                                <span className="text-white text-sm">{selectedProduct.name}</span>
                                <StockAvailability availability={availability[selectedProduct.id]} product={selectedProduct} needed={needed} />
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedProduct(null)
                                    setForm(f => ({ ...f, product_id: '', unit_price: '' }))
                                }}
                                className="text-gray-400 hover:text-red-400 text-xs"
                            >✕</button>
                        </div>
                    )}
                    {!selectedProduct && (
                        <ProductSearchInput
                            products={products}
                            onSelect={handleProductSelect}
                            placeholder={t('search.product.placeholder')}
                        />
                    )}
                </div>

                {/* Form fields — show after product selected */}
                {selectedProduct && (
                    <div className="space-y-3">
                        {/* Quantity */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">{t('common.quantity')}</label>
                            <input
                                type="number"
                                min="1"
                                value={form.quantity}
                                onChange={e => setForm({ ...form, quantity: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>

                        {/* Unit Price */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">{t('orders.unitPrice')}</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.unit_price}
                                onChange={e => setForm({ ...form, unit_price: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>

                        {/* Unit type toggle */}
                        {selectedProduct.secondary_unit && (
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">{t('products.form.unit')}</label>
                                <div className="flex gap-2">
                                    {['base', 'secondary'].map(u => (
                                        <button
                                            key={u}
                                            type="button"
                                            onClick={() => setForm({ ...form, unit_type: u })}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                form.unit_type === u
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                        >
                                            {u === 'base' ? selectedProduct.unit : selectedProduct.secondary_unit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Line total preview */}
                        {form.unit_price && form.quantity && (
                            <div className="flex justify-between text-sm border-t border-gray-800 pt-2">
                                <span className="text-gray-400">{t('common.total')}</span>
                                <span className="text-white font-medium">
                                    {formatCurrency(parseFloat(form.unit_price) * parseInt(form.quantity), lang)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-5">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.product_id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {saving ? t('orders.addItemModal.adding') : t('orders.addItemModal.submit')}
                    </button>
                </div>
            </div>
        </div>
    )
}
