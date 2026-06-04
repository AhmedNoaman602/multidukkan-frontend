import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function OrderInvoice() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
   let user = {}

try {
    user = JSON.parse(localStorage.getItem('user') || '{}')
} catch {
    user = {}
}

    useEffect(() => {
        api.get(`/orders/${id}`)
            .then(res => setOrder(res.data))
            .catch(() => setError('Failed to load invoice'))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <LoadingSpinner />
        </div>
    )

    if (error || !order) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <p className="text-red-500">{error || 'Order not found'}</p>
        </div>
    )

    const hasDiscount = order.discount > 0

    return (
        <>
            {/* Print styles — hides the print button on paper */}
            <style>{`
    @media print {
        .no-print { display: none !important; }
        body { background: white !important; }
        .invoice-wrapper { box-shadow: none !important; }
    }
    body { 
        background: #d7dbe4ff !important; 
        color: #111827 !important;
    }
`}</style>

            {/* Print button — hidden when printing */}
            <div className="no-print flex justify-center pt-6 pb-2 gap-3">
    <button
        onClick={() => window.close()}
        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
    >
        ✕ Close
    </button>
    <button
        onClick={() => window.print()}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
        🖨️ Print / Save as PDF
    </button>
</div>

            {/* Invoice */}
<div className="invoice-wrapper max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-10 mb-10 text-gray-900">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.business_name}</h1>
                        {order.store_name && (
                            <p className="text-gray-500 text-sm mt-1">{order.store_name}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">Invoice</p>
                        <p className="text-gray-500 text-sm mt-1">#{order.invoice_number}</p>
                    </div>
                </div>

                {/* Divider */}
                <hr className="border-gray-200 mb-6" />

                {/* Customer + Date */}
                <div className="flex justify-between mb-8">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
                        <p className="text-gray-900 font-semibold">{order.customer_name}</p>
                        {order.customer_phone && (
                            <p className="text-gray-500 text-sm">{order.customer_phone}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-gray-900 text-sm">
                            {new Date(order.order_date || order.created_at).toLocaleDateString('en-GB')}
                        </p>
                        <div className="mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                order.status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {order.status === 'paid' ? 'Paid' : 'Unpaid'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items table */}
                <table className="w-full mb-6">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left text-xs text-gray-400 uppercase tracking-wider pb-2">Product</th>
                            <th className="text-center text-xs text-gray-400 uppercase tracking-wider pb-2">Qty</th>
                            <th className="text-right text-xs text-gray-400 uppercase tracking-wider pb-2">Unit Price</th>
                            <th className="text-right text-xs text-gray-400 uppercase tracking-wider pb-2">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                                <td className="py-3 text-gray-900 text-sm">{item.product_name}</td>
                                <td className="py-3 text-center text-gray-600 text-sm">{item.quantity}</td>
                                <td className="py-3 text-right text-gray-600 text-sm">{item.unit_price} EGP</td>
                                <td className="py-3 text-right text-gray-900 text-sm font-medium">{item.total} EGP</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                    <div className="w-56 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>{order.subtotal} EGP</span>
                        </div>
                        {hasDiscount && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>- {order.discount} EGP</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
                            <span>Total</span>
                            <span>{order.total} EGP</span>
                        </div>
                        {order.status === 'unpaid' && order.amount_remaining > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span>Amount Due</span>
                                <span>{order.amount_remaining} EGP</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-gray-600 text-sm">{order.notes}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="border-t border-gray-200 mt-8 pt-4 text-center">
                    <p className="text-gray-400 text-xs">Thank you for your business — {user.business_name}</p>
                </div>

            </div>
        </>
    )
}