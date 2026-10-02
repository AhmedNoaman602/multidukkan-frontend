import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate , useLocation} from 'react-router-dom'
import api from '../api/axios'
import BackButton from '../components/BackButton'
import SupplierMultiSelect from '../components/SupplierMultiSelect'
import {useToast} from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import StockLocationEditor from '../components/StockLocationEditor'
import { isShelf, shelfIdFor, stockPayload } from '../lib/locations'

export default function CreateProduct() {
    const [supplierIds, setSupplierIds] = useState([])
    const [saving, setSaving] = useState(false)
    const [newUnit, setNewUnit] = useState('')
    const [showNewUnit, setShowNewUnit] = useState(false)
    const [savingUnit, setSavingUnit] = useState(false)
    const location = useLocation()
    const duplicate = location.state?.duplicate
    const [form, setForm] = useState({
    name: duplicate ? `${duplicate.name}` : '',
    sku: duplicate ? `${duplicate.sku}` : '',
    price: duplicate?.price || '',
    unit: duplicate?.unit || '',
    price_a: duplicate?.price_a || '',
    price_b: duplicate?.price_b || '',
    price_c: duplicate?.price_c || '',
    price_d: duplicate?.price_d || '',
    price_e: duplicate?.price_e || '',
    cost_price: duplicate?.cost_price || '',
    secondary_unit: duplicate?.secondary_unit || '',
    conversion_factor: duplicate?.conversion_factor || '',
    description: '',
    description_ar: '',
    description_en: '',
})
    const [stocks, setStocks] = useState([
        { warehouse_id: '', quantity: 1, threshold: 10, unit_type: 'base', isNew: true }
    ])
    const navigate = useNavigate()
    const { showToast } = useToast()
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => api.get('/warehouses').then(res => res.data.data),
    })
    const { data: stores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: () => api.get('/stores').then(res => res.data.data),
    })
    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => api.get('/units').then(res => res.data.data),
    })
    const { data: suppliers = [] } = useQuery({
        queryKey: ['suppliers', 'all'],
        queryFn: () => api.get('/suppliers?per_page=all').then(res => res.data.data),
    })

    const defaultUnitSet = useRef(false)
    useEffect(() => {
        if (units.length > 0 && !defaultUnitSet.current) {
            defaultUnitSet.current = true
            setForm(f => ({ ...f, unit: units[0].name }))
        }
    }, [units])

    // Initial stock goes to the shelf by default: the user's store, or the only store's.
    const defaultLocationSet = useRef(false)
    useEffect(() => {
        if (defaultLocationSet.current || warehouses.length === 0) return
        defaultLocationSet.current = true
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const shelves = warehouses.filter(isShelf)
        const shelfId = user.store_id ? shelfIdFor(warehouses, user.store_id) : (shelves.length === 1 ? shelves[0].id : '')
        if (shelfId) setStocks(prev => prev.map((s, i) => (i === 0 && !s.warehouse_id ? { ...s, warehouse_id: String(shelfId) } : s)))
    }, [warehouses])

    const hasSecondaryUnit = !!form.secondary_unit && Number(form.conversion_factor) > 1

    const handleSaveUnit = async () => {
        if (!newUnit.trim()) return
        setSavingUnit(true)
        try {
            const res = await api.post('/units', { name: newUnit.trim() })
            const saved = res.data.data ?? res.data
            queryClient.setQueryData(['units'], (prev = []) => [...prev, saved])
            setForm(f => ({ ...f, unit: saved.name }))
            showToast(t('products.form.unitCreated'), 'success')
            setNewUnit('')
            setShowNewUnit(false)
        } catch {
            showToast(t('products.form.unitCreateFailed'), 'error')
        } finally {
            setSavingUnit(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        const hasEmptyWarehouse = stocks.some(s => !s.warehouse_id)
    if (hasEmptyWarehouse) {
        showToast(t('products.create.warehouseRequired'), 'error')
        setSaving(false)
        return
    }

    // A row needs something in it: boxes, loose pieces, or both.
    const hasInvalidQuantity = stocks.some(s =>
        s.warehouse_id && (parseInt(s.quantity) || 0) + (parseInt(s.loose_quantity) || 0) <= 0
    )
    if (hasInvalidQuantity) {
        showToast(t('products.create.quantityInvalid'), 'error')
        setSaving(false)
        return
    }
    if (form.cost_price && stocks.length === 0) {
    showToast(t('products.create.openingStockRequired'), 'error')
    setSaving(false)
    return
}
        try {
            await api.post('/products', {
                ...form,
                supplier_ids: supplierIds,
                price: parseFloat(form.price),
                cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
                stocks: stockPayload(stocks, hasSecondaryUnit),
            })
            showToast(t('products.create.created'), 'success')
            navigate('/products')
        } catch (err) {
            showToast(err.response?.data?.message || t('products.create.createFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <BackButton label={t('products.create.backToProducts')} to="/products" />
                <h2 className="text-2xl font-bold text-white">{t('products.create.title')}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Basic Info */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{t('products.form.basicInfo')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
                            <div className="flex gap-2">
                                <select
                                    value={form.unit}
                                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                >
                                    {units.map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowNewUnit(!showNewUnit)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
                                >
                                    {t('products.form.newUnit')}
                                </button>
                            </div>
                            {showNewUnit && (
                                <div className="flex gap-2 mt-2">
                                    <input
                                        value={newUnit}
                                        onChange={(e) => setNewUnit(e.target.value)}
                                        placeholder={t('products.form.newUnitPlaceholder')}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveUnit())}
                                        className="flex-1 px-3 py-2 bg-gray-800 border border-blue-500 text-white rounded-lg focus:outline-none text-sm"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSaveUnit}
                                        disabled={savingUnit}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs transition-colors"
                                    >
                                        {savingUnit ? '...' : t('common.save')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="col-span-2">
    <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-gray-400">{t('products.form.description')}</label>
    </div>
    <textarea
        value={form.description || ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={3}
        placeholder={t('products.form.descriptionPlaceholder')}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none placeholder-gray-600"
    />
</div>
                    </div>
                </div>

                {/* Price Tiers */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{t('products.form.priceTiers')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    </div>
                </div>

                {/* Secondary Unit */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{t('products.form.secondaryUnit')} <span className="text-gray-600 normal-case font-normal">({t('common.optional')})</span></h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>
                </div>

                {/* Stock by location — sent as entered; the server converts to base units */}
                <StockLocationEditor
                    rows={stocks}
                    onChange={setStocks}
                    warehouses={warehouses}
                    stores={stores}
                    unit={form.unit}
                    secondaryUnit={form.secondary_unit}
                    conversionFactor={form.conversion_factor}
                />

                {/* Submit */}
<div className="flex flex-col items-end gap-2">
    <button
        type="submit"
        disabled={saving}
        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
    >
        {saving ? t('common.saving') : t('products.create.submit')}
    </button>
</div>

            </form>
        </div>
    )
}