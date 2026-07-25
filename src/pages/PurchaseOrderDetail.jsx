import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'

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
            .catch(() => setError('حصلت مشكلة في تحميل أمر الشراء'))
            .finally(() => setLoading(false))
    }, [id])

    const handleCancel = async () => {
        setCancelling(true)
        try {
            await api.delete(`/purchase-orders/${id}`)
            navigate('/purchase-orders')
        } catch (err) {
            setError(err.response?.data?.message || 'حصلت مشكلة في إلغاء أمر الشراء')
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
                <BackButton label="رجوع"/>
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
                            إلغاء الأمر
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
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">رقم الفاتورة</p>
                        <p className="text-white text-2xl font-bold font-mono">{order.invoice_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        order.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}>
                        {order.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">المورد</p>
                        <p className="text-white text-sm font-medium">{order.supplier_name}</p>
                        {order.supplier_phone && (
                            <p className="text-gray-400 text-sm">{order.supplier_phone}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">التاريخ</p>
                        <p className="text-white text-sm">
                            {new Date(order.created_at).toLocaleDateString('en-GB')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">أصناف الأمر</h3>
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            {['المنتج', 'الكمية', 'سعر الوحدة', 'الإجمالي'].map(h => (
                                <th key={h} className="text-start text-xs text-gray-400 uppercase tracking-wider pb-3">
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
                                <td className="py-3 text-gray-400 text-sm">{item.unit_price} ج.م</td>
                                <td className="py-3 text-white text-sm font-medium">{item.total} ج.م</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mt-4">
                    <div className="w-56 space-y-2 border-t border-gray-800 pt-4">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>الإجمالي الفرعي</span>
                            <span>{order.subtotal} ج.م</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-white border-t border-gray-800 pt-2">
                            <span>الإجمالي</span>
                            <span>{order.total} ج.م</span>
                        </div>
                        {order.status === 'unpaid' && order.amount_remaining > 0 && (
                            <div className="flex justify-between text-sm text-red-400">
                                <span>المبلغ المستحق</span>
                                <span>{order.amount_remaining} ج.م</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">ملاحظات</p>
                    <p className="text-white text-sm">{order.notes}</p>
                </div>
            )}

            {/* Cancel confirm modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-white font-semibold mb-2">إلغاء أمر الشراء؟</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            This will reverse the supplier ledger charge and deduct inventory. This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                سيب الأمر
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {cancelling ? 'جاري الإلغاء...' : 'أيوة، الغِ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}