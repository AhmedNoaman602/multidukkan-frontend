import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import SupplierSearchInput from '../components/SupplierSearchInput'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'

export default function EditProduct() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [suppliers, setSuppliers] = useState([])
    const [supplierId, setSupplierId] = useState(null)
    const [generatingDesc, setGeneratingDesc] = useState(false)
    const [units, setUnits] = useState([])
    const [warehouses, setWarehouses] = useState([])
    const [stocks, setStocks] = useState([])
    const [form, setForm] = useState({
        name: '', sku: '', price: '', unit: '',
        price_a: '', price_b: '', price_c: '', price_d: '', price_e: '',
        cost_price:'', 
        description_ar: '', description_en: '',
        secondary_unit: '', conversion_factor: '',
    })
    const { showToast } = useToast()
    const { t } = useTranslation()

    useEffect(() => {
        Promise.all([
            api.get(`/products/${id}`),
            api.get('/warehouses'), 
            api.get('/units'),
            api.get('/suppliers'),
        ]).then(([productRes, warehouseRes, unitRes, supplierRes]) => {
            const p = productRes.data.data  

            setForm({
                name:              p.name || '',
                sku:               p.sku || '',
                price:             p.price || '',
                unit:              p.unit || '',
                price_a:           p.price_a || '',
                price_b:           p.price_b || '',
                price_c:           p.price_c || '',
                price_d:           p.price_d || '',
                price_e:           p.price_e || '',
                cost_price:        p.cost_price || '',
                secondary_unit:    p.secondary_unit || '',
                conversion_factor: p.conversion_factor || '',
                description_ar:    p.description_ar || '',
                description_en:    p.description_en || '',
            })
            
            // Pre-populate selected supplier when loading product:
            if (p.supplier_id) {
                setSupplierId(p.supplier_id)
            }

            // Load existing warehouse stocks
            setStocks(p.stocks.map(s => ({
                warehouse_id:   s.warehouse_id,
                warehouse_name: s.warehouse_name,
                quantity:       s.quantity,
                threshold:      s.threshold,
                isNew:          false,
            })))

            setWarehouses(warehouseRes.data.data)
            setUnits(unitRes.data.data)
            setSuppliers(supplierRes.data.data)
        })
        .catch(() => showToast(t('products.edit.loadFailed'), 'error'))
        .finally(() => setLoading(false))
    }, [id])

    const usedWarehouseIds = stocks.map(s => parseInt(s.warehouse_id)).filter(Boolean)

    const addStock = () => setStocks([
        ...stocks,
        { warehouse_id: '', warehouse_name: '', quantity: 0, threshold: 10, isNew: true }
    ])

    const removeStock = (i) => {
        // Only allow removing new (unassigned) warehouse rows
        if (!stocks[i].isNew) return
        setStocks(stocks.filter((_, idx) => idx !== i))
    }

    const updateStock = (i, field, value) => {
        const updated = [...stocks]
        updated[i][field] = value
        setStocks(updated)
    }

    const handleGenerateDescription = async () => {
        if (!form.name || !form.price || !form.unit) {
            showToast(t('products.form.aiFieldsRequired'), 'error')
            return
        }
        setGeneratingDesc(true)
        try {
            const res = await api.post('/ai/describe-product', {
                name: form.name,
                price: parseFloat(form.price),
            })
            setForm(f => ({
                ...f,
                description_ar: res.data.ar,
                description_en: res.data.en,
                description: `${res.data.ar}\n${res.data.en}`,
            }))
        } catch {
            showToast(t('products.form.aiFailed'), 'error')
        } finally {
            setGeneratingDesc(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.put(`/products/${id}`, {
                ...form,
                price:             parseFloat(form.price),
                price_a:           form.price_a ? parseFloat(form.price_a) : null,
                price_b:           form.price_b ? parseFloat(form.price_b) : null,
                price_c:           form.price_c ? parseFloat(form.price_c) : null,
                price_d:           form.price_d ? parseFloat(form.price_d) : null,
                price_e:           form.price_e ? parseFloat(form.price_e) : null,
                cost_price:        form.cost_price ? parseFloat(form.cost_price) :null,
                conversion_factor: form.conversion_factor ? parseInt(form.conversion_factor) : null,
                supplier_id:       supplierId ?? null,
                stocks: stocks
                    .filter(s => s.warehouse_id)
                    .map(s => ({
                        warehouse_id: parseInt(s.warehouse_id),
                        quantity:     parseInt(s.quantity) || 0,
                        threshold:    parseInt(s.threshold) || 10,
                    }))
            })
            showToast(t('products.edit.updated'), 'success')
            navigate('/products')
        } catch (err) {
            showToast(err.response?.data?.message || t('products.edit.updateFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="">
            <div className="flex items-center gap-4 mb-6">
                <BackButton label={t('products.create.backToProducts')} to="/products"/>
                <h2 className="text-2xl font-bold text-white">{t('products.edit.title')}</h2>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('products.form.productName')}</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('products.form.productCode')}</label>
                        <input
                            value={form.sku}
                            onChange={(e) => setForm({ ...form, sku: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div className="col-span-2">
    <label className="block text-sm text-gray-400 mb-1">
        {t('products.form.supplier')} <span className="text-gray-600">({t('common.optional')})</span>
    </label>
    <SupplierSearchInput
        suppliers={suppliers}
        value={supplierId}
        onSelect={setSupplierId}
        placeholder={t('products.form.supplierSearchPlaceholder')}
    />
</div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('products.defaultPrice')}</label>
                        <input
                            type="number"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div>
    <label className="block text-sm text-gray-400 mb-1">
        {t('products.costPrice')} <span className="text-gray-600">({t('common.optional')})</span>
    </label>
    <input
        type="number"
        value={form.cost_price}
        onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
        placeholder={t('products.form.costPricePlaceholder')}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm placeholder-gray-600"
    />
</div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('products.form.unit')}</label>
                        <select
                            value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        >
                            {units.map(u => (
                                <option key={u.id} value={u.name}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                                            <div className="col-span-2">
    <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-gray-400">{t('products.form.description')}</label>
        <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={generatingDesc || !form.name || !form.price}
            className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 disabled:opacity-40 text-xs font-medium rounded-lg transition-colors"
        >
            {generatingDesc ? t('products.form.generating') : t('products.form.generateWithAi')}
        </button>
    </div>
    <textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={3}
        placeholder={t('products.form.descriptionPlaceholder')}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none placeholder-gray-600"
    />
</div>

                    {['a', 'b', 'c', 'd', 'e'].map(tier => (
                        <div key={tier}>
                            <label className="block text-sm text-gray-400 mb-1">{t(`enums.priceTier.${tier}`)}</label>
                            <input
                                type="number"
                                value={form[`price_${tier}`]}
                                onChange={(e) => setForm({ ...form, [`price_${tier}`]: e.target.value })}
                                placeholder={t('common.optional')}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm placeholder-gray-600"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('products.form.secondaryUnit')}</label>
                        <input
                            value={form.secondary_unit}
                            onChange={(e) => setForm({ ...form, secondary_unit: e.target.value })}
                            placeholder={t('products.form.secondaryUnitPlaceholder')}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm placeholder-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('products.form.conversionFactor')}</label>
                        <input
                            type="number"
                            value={form.conversion_factor}
                            onChange={(e) => setForm({ ...form, conversion_factor: e.target.value })}
                            placeholder={t('products.form.conversionFactorPlaceholder')}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm placeholder-gray-600"
                        />
                        {form.secondary_unit && form.conversion_factor && (
                            <p className="text-xs text-blue-400 mt-1">
                                {t('products.form.conversionPreview', {
                                    secondary: form.secondary_unit,
                                    factor: form.conversion_factor,
                                    base: form.unit,
                                })}
                            </p>
                        )}
                    </div>

                    {/* Warehouse Stock */}
                    <div className="col-span-2">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm text-gray-400">{t('products.form.warehouseStock')}</label>
                            <button
                                type="button"
                                onClick={addStock}
                                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
                            >
                                {t('products.form.addWarehouse')}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {stocks.map((stock, i) => (
                                <div key={i} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 items-end bg-gray-800 p-3 rounded-lg">

                                    <div className="col-span-3">
                                        <label className="block text-xs text-gray-400 mb-1">{t('common.warehouse')}</label>
                                        {stock.isNew ? (
                                            <select
                                                value={stock.warehouse_id}
                                                onChange={(e) => updateStock(i, 'warehouse_id', e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                            >
                                                <option value="">{t('products.form.chooseWarehouse')}</option>
                                                {warehouses
                                                    .filter(w => !usedWarehouseIds.includes(w.id) || w.id === parseInt(stock.warehouse_id))
                                                    .map(w => (
                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                    ))
                                                }
                                            </select>
                                        ) : (
                                            <div className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm">
                                                {stock.warehouse_name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-400 mb-1">{t('common.quantity')}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={stock.quantity}
                                            onChange={(e) => updateStock(i, 'quantity', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-xs text-gray-400 mb-1">{t('products.form.threshold')}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={stock.threshold}
                                            onChange={(e) => updateStock(i, 'threshold', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                        />
                                    </div>

                                    <div className="col-span-1 flex justify-end">
                                        {stock.isNew && (
                                            <button
                                                type="button"
                                                onClick={() => removeStock(i)}
                                                className="px-3 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? t('common.saving') : t('products.edit.submit')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}