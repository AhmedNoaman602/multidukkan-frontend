import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function PurchaseOrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [cancelling, setCancelling] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        api.get(`/purchase-orders/${id}`)
            .then(res => setOrder(res.data.data))
            .catch(() => setError('Failed to load purchase order'))
            .finally(() => setLoading(false))
    }, [id])

    const handleCancel = async () => {
        setCancelling(true)
        try {
            await api.delete(`/purchase-orders/${id}`)
            navigate('/purchase-orders')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel purchase order')
            setShowConfirm(false)
        } finally {
            setCancelling(false)
        }
    }

    if (loading) return <LoadingSpinner />
    if (error && !order) return <p className="text-red-400">{error}</p>

    return (
        <div className="max-w-4xl">
            {/* Back + actions */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/purchase-orders')}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← Back to Purchase Orders
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(`/purchase-orders/${id}/invoice`, '_blank')}
                        className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                        🖨️ Invoice
                    </button>
                    {user.role === 'tenant_admin' && (
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

                <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Supplier</p>
                        <p className="text-white text-sm font-medium">{order.supplier_name}</p>
                        {order.supplier_phone && (
                            <p className="text-gray-400 text-sm">{order.supplier_phone}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Date</p>
                        <p className="text-white text-sm">
                            {new Date(order.created_at).toLocaleDateString('en-GB')}
                        </p>
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
            {order.notes && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-white text-sm">{order.notes}</p>
                </div>
            )}

            {/* Cancel confirm modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-white font-semibold mb-2">Cancel Purchase Order?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            This will reverse the supplier ledger charge and deduct inventory. This cannot be undone.
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