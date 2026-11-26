import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import { useToast } from '../hooks/useToast'
import CancelOrderModal from '../components/CancelOrderModal'
import { useTranslation } from '../i18n/useTranslation'
import { formatCode, formatCurrency, formatDate, formatIdentifier, formatNumber, formatPercent, formatPrice } from '../lib/format'
import { canViewCostData } from '../lib/permissions'

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [showConfirm, setShowConfirm] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({ order_date: '', notes: '' })
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()
    const { t, lang } = useTranslation()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const queryClient = useQueryClient()

    const canEdit = user.role === 'tenant_admin' || user.role === 'store_manager'

    const { data: order, isLoading, isError } = useQuery({
        queryKey: ['orders', id],
        queryFn: () => api.get(`/orders/${id}`).then(res => res.data),
    })

    useEffect(() => {
        if (isError) showToast(t('orders.detail.loadFailed'), 'error')
    }, [isError, showToast, t])

    useEffect(() => {
        if (order && !editMode) {
            setEditForm({
                order_date: order.order_date,
                notes:      order.notes ?? '',
            })
        }
    }, [order, editMode])

    const handleCancelled = () => {
        navigate('/orders')
        queryClient.invalidateQueries({ queryKey: ['orders'], refetchType: 'none' })
        queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' })
        showToast(t('orders.detail.cancelled'), 'success')
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await api.patch(`/orders/${id}`, {
                order_date: editForm.order_date,
                notes:      editForm.notes,
            })
            queryClient.setQueryData(['orders', id], res.data)
            setEditMode(false)
            showToast(t('orders.detail.updated'), 'success')
        } catch (err) {
            showToast(err.response?.data?.message || t('orders.detail.updateFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleCancelEdit = () => {
        setEditMode(false)
        setEditForm({
            order_date: order.order_date,
            notes:      order.notes ?? '',
        })
    }

    if (isLoading) return <LoadingSpinner />
    if (!order) return null

    return (
        <div className="max-w-4xl">
            {/* Back + actions */}
            <div className="flex items-center justify-between mb-6">
                <BackButton label={t('common.back')} />
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(`/orders/${id}/invoice`, '_blank')}
                        className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                        {t('orders.detail.invoiceButton')}
                    </button>

                    {canEdit && !editMode && (
                        <button
                            onClick={() => setEditMode(true)}
                            className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                            ✏️ {t('common.edit')}
                        </button>
                    )}

                    {editMode && (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {saving ? t('common.saving') : t('orders.detail.saveChanges')}
                            </button>
                        </>
                    )}

                    {user.role === 'tenant_admin' && !editMode && (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            {t('orders.detail.cancelOrder')}
                        </button>
                    )}
                </div>
            </div>

            {/* Order header */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t('common.invoice')}</p>
                        <p className="text-white text-2xl font-bold font-mono">{formatIdentifier(order.invoice_number)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        order.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}>
                        {t(`enums.orderStatus.${order.status}`)}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t('common.customer')}</p>
                        <p className="text-white text-sm font-medium">{order.customer_name}</p>
                        {order.customer_phone && (
                            <p className="text-gray-400 text-sm">{formatCode(order.customer_phone)}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t('common.store')}</p>
                        <p className="text-white text-sm">{order.store_name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{t('common.date')}</p>
                        {editMode && order.date_editable ? (
                            <input
                                type="date"
                                value={editForm.order_date}
                                onChange={e => setEditForm({ ...editForm, order_date: e.target.value })}
                                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        ) : (
                            <p className="text-white text-sm">
                                {formatDate(order.order_date, lang)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">{t('orders.detail.orderItems')}</h3>
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            {['common.product', 'common.quantity', 'orders.unitPrice', 'orders.fulfilledFrom', 'common.total'].map(key => (
                                <th key={key} className="text-start text-xs text-gray-400 uppercase tracking-wider pb-3">
                                    {t(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                       {order.items.map((item) => (
                        
    <tr key={item.id}>
        <td className="py-3 text-white text-sm">{item.product_name}</td>
        
        <td className="py-3 text-gray-400 text-sm">
            {formatNumber(item.quantity)}
            {item.unit_label && (
                <span className={`ms-1 text-xs ${item.unit_type !== 'base' ? 'text-blue-400' : 'text-gray-500'}`}>{item.unit_label}</span>
            )}
        </td>

        <td className="py-3 text-gray-400 text-sm">
            {formatPrice(item.unit_price, lang)}
            {item.unit_label && (
                <span className={`ms-1 text-xs ${item.unit_type !== 'base' ? 'text-blue-400' : 'text-gray-500'}`}>/ {item.unit_label}</span>
            )}
        </td>
        <td className="px-4 py-3 text-gray-400 text-sm">
    {item.warehouse_name ?? '—'}
</td>

        <td className="py-3 text-white text-sm font-medium">{formatCurrency(item.total, lang)}</td>
    </tr>
))}
                    </tbody>
                </table>
                </div>
                {/* Totals */}
                <div className="flex justify-end mt-4">
                    <div className="w-56 space-y-2 border-t border-gray-800 pt-4">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>{t('orders.subtotal')}</span>
                            <span>{formatCurrency(order.subtotal, lang)}</span>
                        </div>
{order.discount > 0 && (
    <div className="flex justify-between text-sm text-green-400">
        <span>{t('orders.discount')}</span>
        <span>- {formatCurrency(order.discount, lang)}</span>
    </div>
)}
{order.manual_total != null && (
    <div className="flex justify-between text-sm text-yellow-400">
        <span>{t('orders.manualTotal')}</span>
        <span>{formatCurrency(order.manual_total, lang)}</span>
    </div>
)}


                        <div className="flex justify-between text-base font-bold text-white border-t border-gray-800 pt-2">
                            <span>{t('common.total')}</span>
                            <span>{formatCurrency(order.total, lang)}</span>
                        </div>
                        {order.status === 'unpaid' && order.amount_remaining > 0 && (
                            <div className="flex justify-between text-sm text-red-400">
                                <span>{t('orders.detail.amountDue')}</span>
                                <span>{formatCurrency(order.amount_remaining, lang)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
{/* Profit */}
{canViewCostData(user) && order.unknown_cost_lines !== undefined && (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-4">{t('orders.detail.profitSummary')}</p>
        <div className="flex gap-8">
            <div>
                <p className="text-gray-500 text-xs mb-1">{t('orders.detail.revenue')}</p>
                <p className="text-white font-semibold">{formatCurrency(order.total, lang)}</p>
            </div>
            <div>
                <p className="text-gray-500 text-xs mb-1">{t('orders.detail.cost')}</p>
                <p className="text-white font-semibold">
                    {order.cost === null ? '—' : formatCurrency(order.cost, lang)}
                </p>
            </div>
            <div>
                <p className="text-gray-500 text-xs mb-1">{t('orders.detail.totalProfit')}</p>
                {order.gross_profit === null ? (
                    <p className="font-semibold text-yellow-400">
                        {t('orders.detail.profitUnavailable', { count: order.unknown_cost_lines })}
                    </p>
                ) : (() => {
                    const profit = order.gross_profit
                    const margin = order.total > 0 ? (profit / order.total) * 100 : 0
                    return (
                        <p className={`font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(profit, lang)} <span className="text-xs text-gray-500">({formatPercent(margin, lang, 1)})</span>
                        </p>
                    )
                })()}
            </div>
        </div>
    </div>
)}

            {/* Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{t('common.notes')}</p>
                {editMode ? (
                    <textarea
                        value={editForm.notes}
                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                        rows={3}
                        placeholder={t('orders.detail.notesPlaceholder')}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none"
                    />
                ) : (
                    <p className="text-white text-sm">{order.notes || '—'}</p>
                )}
            </div>

            {showConfirm && (
                <CancelOrderModal
                    orderId={id}
                    invoice={formatIdentifier(order.invoice_number)}
                    onClose={() => setShowConfirm(false)}
                    onCancelled={handleCancelled}
                />
            )}
            
        </div>
    )
}