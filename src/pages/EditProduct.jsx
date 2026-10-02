import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import SupplierMultiSelect from '../components/SupplierMultiSelect'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import StockLocationEditor from '../components/StockLocationEditor'
import { stockPayload } from '../lib/locations'

export default function EditProduct() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [saving, setSaving] = useState(false)
    const [supplierIds, setSupplierIds] = useState([])
    const [generatingDesc, setGeneratingDesc] = useState(false)
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

    const { data, isLoading, isError } = useQuery({
        queryKey: ['products', id, 'edit'],
        queryFn: () => Promise.all([
            api.get(`/products/${id}`),
            api.get('/warehouses'),
            api.get('/units'),
            api.get('/suppliers?per_page=all'),
            api.get(`/products/${id}/suppliers`),
            api.get('/stores'),
        ]).then(([productRes, warehouseRes, unitRes, supplierRes, linkedRes, storeRes]) => ({
            product: productRes.data.data,
            warehouses: warehouseRes.data.data,
            units: unitRes.data.data,
            suppliers: supplierRes.data.data,
            linkedSupplierIds: linkedRes.data.data.map(s => s.id),
            stores: storeRes.data.data,
        })),
    })

    useEffect(() => {
        if (isError) showToast(t('products.edit.loadFailed'), 'error')
    }, [isError, showToast, t])

    const formInitialized = useRef(false)
    useEffect(() => {
        if (!data || formInitialized.current) return
        formInitialized.current = true
        const p = data.product

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

        setSupplierIds(data.linkedSupplierIds)

        // Existing stock loads in base units; the user may re-enter it in the secondary unit.
        setStocks(p.stocks.map(s => ({
            warehouse_id:   s.warehouse_id,
            warehouse_name: s.warehouse_name,
            warehouse_type: s.warehouse_type,
            quantity:       s.quantity,
            unit_type:      'base',
            threshold:      s.threshold,
            isNew:          false,
        })))
    }, [data])

    const warehouses = data?.warehouses || []
    const units = data?.units || []
    const suppliers = data?.suppliers || []
    const stores = data?.stores || []
    const hasSecondaryUnit = !!form.secondary_unit && Number(form.conversion_factor) > 1

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
                supplier_ids:      supplierIds,
                stocks:            stockPayload(stocks, hasSecondaryUnit),
            })
            showToast(t('products.edit.updated'), 'success')
            navigate('/products')
        } catch (err) {
            showToast(err.response?.data?.message || t('products.edit.updateFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) return <LoadingSpinner />

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
    <SupplierMultiSelect
        suppliers={suppliers}
        value={supplierIds}
        onChange={setSupplierIds}
        placeholder={t('products.form.supplierSearchPlaceholder')}
        allSelectedLabel={t('products.form.allSuppliersLinked')}
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

                    {/* Stock by location — set to the amount entered; the server converts and logs the difference */}
                    <div className="col-span-2">
                        <StockLocationEditor
                            rows={stocks}
                            onChange={setStocks}
                            warehouses={warehouses}
                            stores={stores}
                            unit={form.unit}
                            secondaryUnit={form.secondary_unit}
                            conversionFactor={form.conversion_factor}
                        />
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