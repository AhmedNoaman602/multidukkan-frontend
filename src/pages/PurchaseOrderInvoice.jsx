import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, formatDate } from '../lib/format'

export default function PurchaseOrderInvoice() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const { t, lang } = useTranslation()

    useEffect(() => {
        api.get(`/purchase-orders/${id}`)
            .then(res => setOrder(res.data.data))
            .catch(() => setError(t('purchaseOrders.invoice.loadFailed')))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <LoadingSpinner />
        </div>
    )

    if (error || !order) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <p className="text-red-500">{error || t('purchaseOrders.invoice.notFound')}</p>
        </div>
    )

    return (
        <>
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

            {/* Buttons — hidden on print */}
            <div className="no-print flex justify-center pt-6 pb-2 gap-3">
                <button
                    onClick={() => window.close()}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                    {t('common.closeWindow')}
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {t('common.printOrSavePdf')}
                </button>
            </div>

            {/* Invoice */}
<div className="invoice-wrapper max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-10 mb-10 text-gray-900">

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.business_name}</h1>
                    </div>
                    <div className="text-end">
                        <p className="text-2xl font-bold text-gray-900">{t('purchaseOrders.invoice.heading')}</p>
                        <p className="text-gray-500 text-sm mt-1">#{order.invoice_number}</p>
                    </div>
                </div>

                <hr className="border-gray-200 mb-6" />

                {/* Supplier + Date */}
                <div className="flex justify-between mb-8">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('common.supplier')}</p>
                        <p className="text-gray-900 font-semibold">{order.supplier_name}</p>
                        {order.supplier_phone && (
                            <p className="text-gray-500 text-sm">{order.supplier_phone}</p>
                        )}
                    </div>
                    <div className="text-end">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('common.date')}</p>
                        <p className="text-gray-900 text-sm">
                            {formatDate(order.created_at, lang)}
                        </p>
                        <div className="mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                order.status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {t(`enums.orderStatus.${order.status}`)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items table */}
                <table className="w-full mb-6">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-start text-xs text-gray-400 uppercase tracking-wider pb-2">{t('common.product')}</th>
                            <th className="text-center text-xs text-gray-400 uppercase tracking-wider pb-2">{t('common.quantity')}</th>
                            <th className="text-end text-xs text-gray-400 uppercase tracking-wider pb-2">{t('orders.unitPrice')}</th>
                            <th className="text-end text-xs text-gray-400 uppercase tracking-wider pb-2">{t('common.total')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                                <td className="py-3 text-gray-900 text-sm">{item.product_name}</td>
                                <td className="py-3 text-center text-gray-600 text-sm">{item.quantity}</td>
                                <td className="py-3 text-end text-gray-600 text-sm">{formatCurrency(item.unit_price, lang)}</td>
                                <td className="py-3 text-end text-gray-900 text-sm font-medium">{formatCurrency(item.total, lang)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                    <div className="w-56 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{t('orders.subtotal')}</span>
                            <span>{formatCurrency(order.subtotal, lang)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
                            <span>{t('common.total')}</span>
                            <span>{formatCurrency(order.total, lang)}</span>
                        </div>
                        {order.status === 'unpaid' && order.amount_remaining > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span>{t('orders.detail.amountDue')}</span>
                                <span>{formatCurrency(order.amount_remaining, lang)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('common.notes')}</p>
                        <p className="text-gray-600 text-sm">{order.notes}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="border-t border-gray-200 mt-8 pt-4 text-center">
                    <p className="text-gray-400 text-xs">{user.business_name}</p>
                </div>

            </div>
        </>
    )
}
