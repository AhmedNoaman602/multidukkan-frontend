import { useState , useEffect } from 'react'
import ProductSearchInput from './ProductSearchInput'
import {useToast} from '../hooks/useToast'
import api from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency } from '../lib/format'

export default function AddItemModal({ open, onClose,orderId, onSuccess }) {
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [products,setProducts] = useState([])
    const[warehouses,setWarehouses] = useState([])
    const [inventory, setInventory] = useState([])
    const [saving, setSaving] = useState(false)
    const [loadingData, setLoadingData] = useState(false)
    const {showToast} = useToast()
    const { t, lang } = useTranslation()

    const [form, setForm] = useState({
        product_id: '',
        quantity: 1,
        warehouse_id: '',
        unit_type: 'base',
        unit_price: '',
    })

    useEffect(() => {
       if (!open) return
       Promise.all([
        api.get('/products?per_page=all'),
        api.get('/warehouses'),
        api.get('/inventory?per_page=all'),
    ])
    .then(([productsRes, warehousesRes, inventoryRes]) => {
        setProducts(productsRes.data.data)
        setWarehouses(warehousesRes.data.data)
        setInventory(inventoryRes.data.data)
    })
    .catch(err => showToast(err.response?.data?.message || t('orders.create.loadFailed'), 'error'))
    },[open , orderId])


    const handleProductSelect = (product) => {
        setSelectedProduct(product)
        setForm(f => ({
            ...f,
            product_id: String(product.id),
            unit_price: product.price ?? '',
        }))
    }

    const getStock = (warehouseId) => {
        if (!form.product_id || !warehouseId) return 0
        const inv = inventory.find(i =>
            i.warehouse_id === warehouseId &&
            i.product_id === parseInt(form.product_id)
        )
        return inv ? inv.quantity : 0
    }

    const handleClose = () => {
        setSelectedProduct(null)
        setForm({ product_id: '', quantity: 1, warehouse_id: '', unit_type: 'base', unit_price: '' })
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
                warehouse_id:form.warehouse_id,
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
                            <span className="text-white text-sm">{selectedProduct.name}</span>
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

                        {/* Warehouse */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">{t('common.warehouse')}</label>
                            <select
                                value={form.warehouse_id}
                                onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            >
                                <option value="">{t('products.form.chooseWarehouse')}</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} ({getStock(w.id)})
                                    </option>
                                ))}
                            </select>
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
                        disabled={saving || !form.product_id || !form.warehouse_id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {saving ? t('orders.addItemModal.adding') : t('orders.addItemModal.submit')}
                    </button>
                </div>
            </div>
        </div>
    )
}
