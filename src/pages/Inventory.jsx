import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'
import { useToast } from '../hooks/useToast'
import { useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/useTranslation'

export default function Inventory() {
    const [inventory, setInventory] = useState([]) 
    const [stores, setStores] = useState([])
    const [selectedStore, setSelectedStore] = useState('')
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [adjustingItem, setAdjustingItem] = useState(null)
    const [adjustQty, setAdjustQty] = useState('')
    const [adjustNotes, setAdjustNotes] = useState('')
    const [adjustDirection, setAdjustDirection] = useState('in')
    const [adjustLoading, setAdjustLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedWarehouse, setSelectedWarehouse] = useState('')
    const [warehousesList, setWarehousesList] = useState([])
    const [adjustUnitType, setAdjustUnitType] = useState('base')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const canAdjust = user.role !== 'store_staff'
    const isAdmin = user.role === 'tenant_admin'

    const { showToast } = useToast()
    const location = useLocation()
    const { t, dir } = useTranslation()

    const [lowStockOnly , setLowStockOnly] = useState(
        new URLSearchParams(location.search).get('low_stock') === '1'
    )

    const fetchInventory = async () => {
        try {
            const [inventoryRes, storesRes, warehousesRes] = await Promise.all([
                api.get('/inventory', { 
                    params: { page, search, warehouse_id: selectedWarehouse, low_stock: lowStockOnly ? 1 : undefined } 
                }),               
                 api.get('/stores'),
                 api.get('/warehouses'),
            ])
            setInventory(inventoryRes.data.data)
            setLastPage(inventoryRes.data.meta.last_page)
            setStores(storesRes.data.data)
            setWarehousesList(warehousesRes.data.data)
        } catch (err) {
            showToast(err.response?.data?.message || t('inventory.loadFailed'), 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchInventory() }, [page, search, selectedWarehouse , lowStockOnly])

    const openAdjustModal = (item, direction) => {
        setAdjustingItem(item)
        setAdjustDirection(direction)
        setAdjustQty('')
        setAdjustNotes('')
    }

    const closeAdjustModal = () => {
        setAdjustingItem(null)
        setAdjustQty('')
        setAdjustNotes('')
    }

    const submitAdjust = async () => {
        const qty = parseInt(adjustQty, 10)
        if (!qty || qty < 1) {
            showToast(t('inventory.quantityInvalid'), 'error')
            return
        }
        if (!adjustNotes.trim()) {
            showToast(t('inventory.reasonRequired'), 'error')
            return
        }
        setAdjustLoading(true)
        try {
            await api.post(`/inventory/${adjustingItem.id}/adjust`, {
                quantity: qty,
                direction: adjustDirection,
                unit_type: adjustUnitType,
                notes: adjustNotes.trim(),
            })
            await fetchInventory()
            closeAdjustModal()
        } catch (err) {
            showToast(err.response?.data?.message || t('inventory.adjustFailed'), 'error')
        } finally {
            setAdjustLoading(false)
        }
    }

   const previewNewQty = () => {
    const qty = parseInt(adjustQty, 10) || 0
    if (!adjustingItem) return 0
    const baseQty = adjustUnitType === 'secondary' && adjustingItem.conversion_factor
        ? qty * adjustingItem.conversion_factor
        : qty
    return adjustDirection === 'in'
        ? adjustingItem.quantity + baseQty
        : adjustingItem.quantity - baseQty
}

    const filteredInventory = inventory.filter(item => !selectedStore || String(item.store_id) === String(selectedStore))

 const handleSearch = (value) => {
    setSearch(value)
    setPage(1)
}

    // Pagination arrows are physical, so they have to follow the reading
    // direction rather than being baked into the translated label.
    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">{t('inventory.title')}</h2>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={t('search.product.placeholder')}
                    />
                    <button
    onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1) }}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
        lowStockOnly
            ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
    }`}
>
    {t('inventory.lowStockOnly')}
</button>
                    {isAdmin && stores.length > 0 && (
                        <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="">{t('common.allStores')}</option>
                        {stores.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}
                </div>
            </div>
{/* Low stock toggle */}
    {lowStockOnly && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
           <span className="text-orange-400 text-sm">{t('inventory.showingLowStockOnly')}</span>
            <button
                onClick={() => setLowStockOnly(false)}
                className="text-xs text-gray-500 hover:text-white ms-auto"
            >
                {t('inventory.clearFilter')}
            </button>
        </div>
    )}

            <div className="flex gap-2 mb-4 border-b border-gray-800 pb-3 overflow-x-auto">
    {[{ key: '', label: t('inventory.allWarehouses') }, ...warehousesList.map(w => ({ key: w.id, label: w.name }))].map(tab => (
        <button
            key={tab.key}
            onClick={() => { setSelectedWarehouse(tab.key) ; setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                String(selectedWarehouse) === String(tab.key)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
        >
            {tab.label}
        </button>
    ))}
</div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {[
                                'common.product',
                                ...(isAdmin ? ['common.store'] : []),
                                'common.warehouse',
                                'common.quantity',
                                'products.form.threshold',
                                'common.status',
                                'common.actions',
                            ].map(key => (
                                <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {t(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredInventory.map(item => (
                            <tr key={item.id} className={`transition-colors hover:bg-gray-800/50 ${item.low_stock ? 'bg-red-500/5' : ''}`}>
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {item.product_name}
                                </td>

                                {/* Store column — admin only */}
                                {isAdmin && (
                                    <td className="px-4 py-3 text-blue-400 text-sm">
                                        {item.store_name || '—'}
                                    </td>
                                )}

                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {item.warehouse_name}
                                </td>
                                <td className="px-4 py-3 text-white text-sm font-semibold">
                                    {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {item.threshold}
                                </td>
                                <td className="px-4 py-3">
                                    {item.low_stock ? (
                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                                            {t('inventory.lowStock')}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                                            {t('inventory.inStock')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {canAdjust ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openAdjustModal(item, 'in')}
                                                className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                                            >
                                                {t('inventory.addAction')}
                                            </button>
                                            <button
                                                onClick={() => openAdjustModal(item, 'out')}
                                                disabled={item.quantity === 0}
                                                className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                {t('inventory.removeAction')}
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 text-xs">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredInventory.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {selectedStore ? t('inventory.emptyStore') : t('inventory.empty')}
                    </div>
                )}
            </div>

            {lastPage > 1 && (
    <div className="flex justify-between items-center mt-4">
        <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
        >
            <PrevIcon size={16} />
            {t('common.previous')}
        </button>
        <span className="text-gray-400 text-sm">{t('common.pageOf', { page, total: lastPage })}</span>
        <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === lastPage}
            className="flex items-center gap-1 px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
        >
            {t('common.next')}
            <NextIcon size={16} />
        </button>
    </div>
)}

            <Modal
                open={!!adjustingItem}
                onClose={closeAdjustModal}
                title={adjustDirection === 'in' ? t('inventory.adjust.addTitle') : t('inventory.adjust.removeTitle')}
                setAdjustUnitType={'base'}
            >
                {adjustingItem && (
                    <form onSubmit={(e) => { e.preventDefault(); submitAdjust(); }}>
                        <div className="space-y-4">
                            <div className="text-sm text-gray-400 space-y-1">
                                <div>{t('inventory.adjust.product', { name: adjustingItem.product_name })}</div>
                                <div>{t('inventory.adjust.warehouse', { name: adjustingItem.warehouse_name })}</div>
                                <div>{t('inventory.adjust.currentStock', { qty: adjustingItem.quantity })}</div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {adjustDirection === 'in' ? t('inventory.adjust.quantityToAdd') : t('inventory.adjust.quantityToRemove')}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                    autoFocus
                                />
                            </div>
                            {adjustingItem?.secondary_unit && (
    <div>
        <label className="block text-sm text-gray-400 mb-1">{t('products.form.unit')}</label>
        <div className="flex gap-2">
            {['base', 'secondary'].map(u => (
                <button
                    key={u}
                    type="button"
                    onClick={() => setAdjustUnitType(u)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        adjustUnitType === u
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    {u === 'base'
                        ? adjustingItem.product_unit
                        : adjustingItem.secondary_unit}
                </button>
            ))}
        </div>
    </div>
)}

                            {adjustQty && (
                                <div className="text-sm text-gray-400">
                                    {t('inventory.adjust.newStockWillBe', { qty: previewNewQty() })}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    {t('inventory.adjust.reason')}
                                </label>
                                <textarea
                                    value={adjustNotes}
                                    onChange={(e) => setAdjustNotes(e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                    placeholder={t('inventory.adjust.reasonPlaceholder')}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeAdjustModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustLoading || !adjustQty || !adjustNotes.trim()}
                                    className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                        adjustDirection === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {adjustLoading ? t('common.saving') : adjustDirection === 'in' ? t('inventory.adjust.addTitle') : t('inventory.adjust.removeTitle')}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    )
}