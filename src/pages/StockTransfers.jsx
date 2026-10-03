import { useEffect, useState } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import StockTransferModal from '../components/StockTransferModal'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { formatDateTime, formatNumber } from '../lib/format'
import { isShelf, sortShelfFirst } from '../lib/locations'
import { canTransferStock } from '../lib/permissions'

const TYPES = ['manual', 'replenishment']

const statusStyles = {
    COMPLETED: 'bg-green-500/20 text-green-400',
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    APPROVED: 'bg-blue-500/20 text-blue-400',
    REJECTED: 'bg-red-500/20 text-red-400',
}

function Location({ location }) {
    const { t } = useTranslation()
    if (!location) return <span>—</span>
    return (
        <span className="whitespace-nowrap [unicode-bidi:isolate]">
            {location.name}
            {isShelf(location) && (
                <span className="ms-1.5 px-1.5 py-0.5 bg-blue-500/15 text-blue-400 text-xs rounded">{t('common.shelf')}</span>
            )}
        </span>
    )
}

export default function StockTransfers() {
    const [page, setPage] = useState(1)
    const [type, setType] = useState('')
    const [warehouseId, setWarehouseId] = useState('')
    const [storeId, setStoreId] = useState('')
    const [modalOpen, setModalOpen] = useState(false)

    const { showToast } = useToast()
    const { t, lang, dir } = useTranslation()
    const queryClient = useQueryClient()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const isAdmin = user.role === 'tenant_admin'
    const canCreate = canTransferStock(user)

    const { data, isLoading, isError } = useQuery({
        queryKey: ['stock-transfers', { page, type, warehouseId, storeId }],
        queryFn: () => api.get('/stock-transfers', {
            params: {
                page,
                type: type || undefined,
                warehouse_id: warehouseId || undefined,
                store_id: isAdmin ? (storeId || undefined) : undefined,
            },
        }).then(res => res.data),
        placeholderData: keepPreviousData,
    })

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => api.get('/warehouses').then(res => res.data.data),
    })

    const { data: stores = [] } = useQuery({
        queryKey: ['stores'],
        queryFn: () => api.get('/stores').then(res => res.data.data),
        enabled: isAdmin,
    })

    useEffect(() => {
        if (isError) showToast(t('stockTransfers.loadFailed'), 'error')
    }, [isError, showToast, t])

    const transfers = data?.data || []
    const lastPage = data?.meta?.last_page || 1
    const hasFilters = type || warehouseId || storeId
    const locationOptions = sortShelfFirst(warehouses.filter(w => !storeId || w.store_id === parseInt(storeId)))

    const resetFilters = () => {
        setType('')
        setWarehouseId('')
        setStoreId('')
        setPage(1)
    }

    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight
    const arrow = dir === 'rtl' ? '←' : '→'

    const selectClass = 'px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500'

    if (isLoading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">{t('stockTransfers.title')}</h2>
                {canCreate && (
                    <button
                        onClick={() => setModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        + {t('stockTransfers.newTransfer')}
                    </button>
                )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <select value={type} onChange={e => { setType(e.target.value); setPage(1) }} className={selectClass}>
                    <option value="">{t('stockTransfers.allTypes')}</option>
                    {TYPES.map(value => <option key={value} value={value}>{t(`enums.transferType.${value}`)}</option>)}
                </select>

                {isAdmin && stores.length > 1 && (
                    <select value={storeId} onChange={e => { setStoreId(e.target.value); setWarehouseId(''); setPage(1) }} className={selectClass}>
                        <option value="">{t('common.allStores')}</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}

                <select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(1) }} className={selectClass}>
                    <option value="">{t('stockTransfers.allLocations')}</option>
                    {locationOptions.map(w => (
                        <option key={w.id} value={w.id}>{w.name}{isShelf(w) ? ` (${t('common.shelf')})` : ''}</option>
                    ))}
                </select>

                {hasFilters && (
                    <button onClick={resetFilters} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {t('common.clearFilters')}
                    </button>
                )}
            </div>

            {isError ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500">
                    {t('stockTransfers.loadFailed')}
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                {['common.date', 'common.type', 'stockTransfers.route', 'stockTransfers.lines', 'common.status', 'common.createdBy'].map(key => (
                                    <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {t(key)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {transfers.map(transfer => (
                                <tr key={transfer.id} className="hover:bg-gray-800/50 transition-colors align-top">
                                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap [unicode-bidi:plaintext]">
                                        {formatDateTime(transfer.created_at, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-400 text-xs rounded">
                                            {t(`enums.transferType.${transfer.type}`)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 text-sm">
                                        <Location location={transfer.from} />
                                        <span className="mx-2 text-gray-500">{arrow}</span>
                                        <Location location={transfer.to} />
                                        {transfer.notes && <div className="text-xs text-gray-500 mt-1">{transfer.notes}</div>}
                                        {transfer.order && (
                                            <Link
                                                to={`/orders/${transfer.order.id}/invoice`}
                                                className="block text-xs text-blue-400 hover:text-blue-300 mt-1 [unicode-bidi:plaintext]"
                                            >
                                                {t('stockTransfers.forInvoice', { number: transfer.order.invoice_number })}
                                            </Link>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {transfer.items.map(item => (
                                            <div key={item.id} className="whitespace-nowrap">
                                                <span className="text-white">{item.product_name}</span>
                                                <span className="text-gray-400 ms-2">{formatNumber(item.quantity)} {item.unit_name}</span>
                                                {item.conversion_factor > 1 && (
                                                    <span className="text-gray-500 ms-1">({formatNumber(item.base_quantity)} {item.base_unit})</span>
                                                )}
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        <span className={`px-2 py-0.5 text-xs rounded ${statusStyles[transfer.status] || 'bg-gray-700 text-gray-300'}`}>
                                            {t(`enums.transferStatus.${transfer.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                                        {transfer.creator?.name || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {transfers.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            {hasFilters ? t('stockTransfers.emptyFiltered') : t('stockTransfers.empty')}
                        </div>
                    )}
                </div>
            )}

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

            {canCreate && (
                <StockTransferModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
                        queryClient.invalidateQueries({ queryKey: ['inventory'] })
                    }}
                />
            )}
        </div>
    )
}
