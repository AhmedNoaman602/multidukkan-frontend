import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import Modal from './Modal'
import ProductSearchInput from './ProductSearchInput'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { formatUnitBreakdown } from '../lib/format'
import { isShelf, sortShelfFirst, shelfIdFor } from '../lib/locations'

// Moving stock *out of* storage defaults to the store's shelf; anything else waits for a choice.
const defaultDestination = (warehouses, fromId) => {
    const from = warehouses.find(w => w.id === parseInt(fromId))
    return from && !isShelf(from) ? String(shelfIdFor(warehouses, from.store_id)) : ''
}

export default function StockTransferModal({ open, onClose, onSuccess, initialFromId = '', initialProduct = null }) {
    const { t } = useTranslation()
    const { showToast } = useToast()

    const [fromId, setFromId] = useState('')
    const [toId, setToId] = useState('')
    const [product, setProduct] = useState(null)
    const [unitType, setUnitType] = useState('base')
    const [quantity, setQuantity] = useState('')
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => api.get('/warehouses').then(res => res.data.data),
        enabled: open,
    })

    const { data: stores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: () => api.get('/stores').then(res => res.data.data),
        enabled: open,
    })

    const { data: products = [] } = useQuery({
        queryKey: ['products', 'all'],
        queryFn: () => api.get('/products?per_page=all').then(res => res.data.data),
        enabled: open,
    })

    useEffect(() => {
        if (!open) return
        setFromId(initialFromId ? String(initialFromId) : '')
        setProduct(initialProduct)
        setUnitType('base')
        setQuantity('')
        setNotes('')
        setError('')
    }, [open, initialFromId, initialProduct])

    // Recompute the destination once the location list is known, and whenever the source changes.
    useEffect(() => {
        if (open) setToId(defaultDestination(warehouses, fromId))
    }, [open, fromId, warehouses])

    const from = warehouses.find(w => w.id === parseInt(fromId))
    const sources = sortShelfFirst(warehouses)
    const destinations = from
        ? sortShelfFirst(warehouses.filter(w => w.store_id === from.store_id && w.id !== from.id))
        : []

    const locationLabel = (w) => {
        const storeName = stores.length > 1 ? stores.find(s => s.id === w.store_id)?.name : null
        return [w.name, isShelf(w) ? `(${t('common.shelf')})` : null, storeName ? `· ${storeName}` : null]
            .filter(Boolean)
            .join(' ')
    }

    const qty = parseInt(quantity, 10) || 0
    const factor = unitType === 'secondary' ? (Number(product?.conversion_factor) || 1) : 1
    const sameLocation = fromId && toId && fromId === toId
    const canSubmit = fromId && toId && !sameLocation && product && qty >= 1 && !saving

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!canSubmit) return
        setSaving(true)
        setError('')
        try {
            await api.post('/stock-transfers', {
                from_warehouse_id: parseInt(fromId),
                to_warehouse_id: parseInt(toId),
                notes: notes.trim() || null,
                items: [{ product_id: product.id, quantity: qty, unit_type: unitType }],
            })
            showToast(t('stockTransfers.modal.success'), 'success')
            onSuccess?.()
            onClose()
        } catch (err) {
            const errors = err.response?.data?.errors
            setError((errors && Object.values(errors)[0]?.[0]) || err.response?.data?.message || t('stockTransfers.modal.failed'))
        } finally {
            setSaving(false)
        }
    }

    const selectClass = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm'

    return (
        <Modal open={open} onClose={onClose} title={t('stockTransfers.modal.title')} error={error}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('stockTransfers.modal.source')}</label>
                        <select value={fromId} onChange={e => setFromId(e.target.value)} className={selectClass}>
                            <option value="">{t('stockTransfers.modal.chooseLocation')}</option>
                            {sources.map(w => <option key={w.id} value={w.id}>{locationLabel(w)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('stockTransfers.modal.destination')}</label>
                        <select value={toId} onChange={e => setToId(e.target.value)} disabled={!from} className={`${selectClass} disabled:opacity-50`}>
                            <option value="">{t('stockTransfers.modal.chooseLocation')}</option>
                            {destinations.map(w => <option key={w.id} value={w.id}>{locationLabel(w)}</option>)}
                        </select>
                    </div>
                </div>
                {sameLocation && <p className="text-xs text-red-400">{t('stockTransfers.modal.sameLocation')}</p>}

                <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('common.product')}</label>
                    {product ? (
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                            <span className="text-white text-sm">{product.name}</span>
                            <button
                                type="button"
                                onClick={() => { setProduct(null); setUnitType('base') }}
                                className="text-xs text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <ProductSearchInput products={products} onSelect={(p) => { setProduct(p); setUnitType('base') }} />
                    )}
                </div>

                {product?.secondary_unit && Number(product.conversion_factor) > 1 && (
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('stockTransfers.modal.unit')}</label>
                        <div className="flex gap-2">
                            {['base', 'secondary'].map(u => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => setUnitType(u)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        unitType === u ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {u === 'base' ? product.unit : product.secondary_unit}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('common.quantity')}</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        className={selectClass}
                    />
                    {product && qty >= 1 && (
                        <p className="text-xs text-gray-500 mt-1.5">
                            {t('stockTransfers.modal.preview', { qty: formatUnitBreakdown(qty * factor, product) })}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        {t('common.notes')} <span className="text-gray-600">({t('common.optional')})</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        maxLength={500}
                        placeholder={t('stockTransfers.modal.notesPlaceholder')}
                        className={`${selectClass} resize-none`}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? t('common.saving') : t('stockTransfers.modal.submit')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
