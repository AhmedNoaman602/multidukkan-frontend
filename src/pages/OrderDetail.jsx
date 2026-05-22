import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [cancelling, setCancelling] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({ order_date: '', notes: '', discount: '' })
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const canEdit = user.role === 'tenant_admin' || user.role === 'store_manager'

    const fetchOrder = () => {
        api.get(`/orders/${id}`)
            .then(res => {
                setOrder(res.data)
                setEditForm({
                    order_date: res.data.created_at?.split('T')[0] ?? res.data.created_at?.split(' ')[0],
                    notes:      res.data.notes ?? '',
                    discount:   res.data.discount ?? 0,
                })
            })
            .catch(() => setError('Failed to load order'))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchOrder() }, [id])

    const handleCancel = async () => {
        setCancelling(true)
        try {
            await api.delete(`/orders/${id}`)
            navigate('/orders')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel order')
            setShowConfirm(false)
        } finally {
            setCancelling(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            const res = await api.patch(`/orders/${id}`, {
                order_date: editForm.order_date,
                notes:      editForm.notes,
                discount:   parseFloat(editForm.discount) || 0,
            })
            setOrder(res.data)
            setEditMode(false)
            setSuccess('Order updated successfully.')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update order')
        } finally {
            setSaving(false)
        }
    }

    const handleCancelEdit = () => {
        setEditMode(false)
        setEditForm({
            order_date: order.created_at?.split('T')[0] ?? order.created_at?.split(' ')[0],
            notes:      order.notes ?? '',
            discount:   order.discount ?? 0,
        })
        setError('')
    }

    if (loading) return <LoadingSpinner />
    if (error && !order) return <p className="text-red-400">{error}</p>

    const hasDiscount = order.discount > 0
    const hasPayments = order.payments?.length > 0

    return (
        <div className="max-w-4xl">
            {/* Back + actions */}
            <div className="flex items-center justify-between mb-6">
                <BackButton label="Back" />
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(`/orders/${id}/invoice`, '_blank')}
                        className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                        🖨️ Invoice
                    </button>

                    {canEdit && !editMode && (
                        <button
                            onClick={() => setEditMode(true)}
                            className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                            ✏️ Edit
                        </button>
                    )}

                    {editMode && (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    )}

                    {user.role === 'tenant_admin' && !editMode && (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            Cancel Order
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {success}
                </div>
            )}

            {/* Order header */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Invoice Number</p>
                        <p className="text-white text-2xl font-bold font-mono">{order.invoice_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        order.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}>
                        {order.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-6">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Customer</p>
                        <p className="text-white text-sm font-medium">{order.customer_name}</p>
                        {order.customer_phone && (
                            <p className="text-gray-400 text-sm">{order.customer_phone}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Store</p>
                        <p className="text-white text-sm">{order.store_name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Date</p>
                        {editMode ? (
                            <input
                                type="date"
                                value={editForm.order_date}
                                onChange={e => setEditForm({ ...editForm, order_date: e.target.value })}
                                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        ) : (
                            <p className="text-white text-sm">
                                {new Date(order.created_at).toLocaleDateString('en-GB')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">Order Items</h3>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            {['Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                                <th key={h} className="text-left text-xs text-gray-400 uppercase tracking-wider pb-3">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {order.items.map((item, index) => (
                            <tr key={index}>
                                <td className="py-3 text-white text-sm">{item.product_name}</td>
                                <td className="py-3 text-gray-400 text-sm">{item.quantity}</td>
                                <td className="py-3 text-gray-400 text-sm">{item.unit_price} EGP</td>
                                <td className="py-3 text-white text-sm font-medium">{item.total} EGP</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mt-4">
                    <div className="w-56 space-y-2 border-t border-gray-800 pt-4">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal</span>
                            <span>{order.subtotal} EGP</span>
                        </div>

                        {/* Discount row */}
                        {(hasDiscount || editMode) && (
                            <div className="flex justify-between text-sm text-green-400 items-center">
                                <span>Discount</span>
                                {editMode ? (
                                    <div className="flex items-center gap-1">
                                        {hasPayments ? (
                                            <span className="text-gray-500 text-xs">Locked (has payments)</span>
                                        ) : (
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={editForm.discount}
                                                onChange={e => setEditForm({ ...editForm, discount: e.target.value })}
                                                className="w-24 px-2 py-1 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm text-right"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <span>- {order.discount} EGP</span>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between text-base font-bold text-white border-t border-gray-800 pt-2">
                            <span>Total</span>
                            <span>{order.total} EGP</span>
                        </div>
                        {order.status === 'unpaid' && order.amount_remaining > 0 && (
                            <div className="flex justify-between text-sm text-red-400">
                                <span>Amount Due</span>
                                <span>{order.amount_remaining} EGP</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Notes</p>
                {editMode ? (
                    <textarea
                        value={editForm.notes}
                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                        rows={3}
                        placeholder="Add notes..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none"
                    />
                ) : (
                    <p className="text-white text-sm">{order.notes || '—'}</p>
                )}
            </div>

            {/* Cancel confirm modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-white font-semibold mb-2">Cancel Order?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            This will reverse the ledger charge and restore inventory. This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Keep Order
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}