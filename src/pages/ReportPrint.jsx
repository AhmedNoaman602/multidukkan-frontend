import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import { paymentMethodLabels } from '../lib/labels'

const methodLabel = paymentMethodLabels

export default function ReportPrint() {
    const [searchParams] = useSearchParams()
    const from = searchParams.get('from')
    const to   = searchParams.get('to')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    let user = {}
    try { user = JSON.parse(localStorage.getItem('user') || '{}') } catch {}

    useEffect(() => {
        api.get(`/reports/daily?from=${from}&to=${to}&print=1`)
            .then(res => setData(res.data))
            .finally(() => setLoading(false))
    }, [from, to])

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <LoadingSpinner />
        </div>
    )

    if (!data) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <p className="text-red-500">حصلت مشكلة في تحميل التقرير</p>
        </div>
    )

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                }
                body { background: #d7dbe4ff !important; }
            `}</style>

            {/* Buttons */}
            <div className="no-print flex justify-center pt-6 pb-2 gap-3">
                <button
                    onClick={() => window.close()}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                    ✕ إغلاق
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    🖨️ طباعة / حفظ PDF
                </button>
            </div>

            {/* Report */}
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-10 mb-10 text-gray-900">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.business_name}</h1>
                        <p className="text-gray-500 text-sm mt-1">تقرير المبيعات</p>
                    </div>
                    <div className="text-end">
                        <p className="text-gray-500 text-sm">
                            {from === to ? from : `من ${from} إلى ${to}`}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            تاريخ الطباعة: {new Date().toLocaleDateString('en-GB')}
                        </p>
                    </div>
                </div>

                <hr className="border-gray-200 mb-6" />

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'إجمالي الإيرادات',   value: `${data.summary.total_revenue} ج.م` },
                        { label: 'إجمالي المحصل', value: `${data.summary.total_collected} ج.م` },
                        { label: 'المستحقات',     value: `${data.summary.outstanding} ج.م` },
                        { label: 'إجمالي الربح',    value: `${data.summary.gross_profit} ج.م` },
                    ].map(stat => (
                        <div key={stat.label} className="border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Orders by Customer */}
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    الطلبات لكل عميل
                </h3>
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-start text-xs text-gray-400 uppercase pb-2">العميل</th>
                            <th className="text-center text-xs text-gray-400 uppercase pb-2">الطلبات</th>
                            <th className="text-end text-xs text-gray-400 uppercase pb-2">الإجمالي</th>
                            <th className="text-end text-xs text-gray-400 uppercase pb-2">المحصل</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.orders_by_customer.data.map((c, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-2 text-gray-900 text-sm">{c.customer_name}</td>
                                <td className="py-2 text-center text-gray-600 text-sm">{c.orders_count}</td>
                                <td className="py-2 text-end text-gray-600 text-sm">{c.total} ج.م</td>
                                <td className="py-2 text-end text-gray-900 text-sm font-medium">{c.collected} ج.م</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Daily Breakdown */}
                {data.daily_breakdown.total > 1 && (
                    <>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                            التفصيل اليومي
                        </h3>
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-start text-xs text-gray-400 uppercase pb-2">التاريخ</th>
                                    <th className="text-center text-xs text-gray-400 uppercase pb-2">الطلبات</th>
                                    <th className="text-end text-xs text-gray-400 uppercase pb-2">الإيرادات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.daily_breakdown.data.map((day, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-2 text-gray-900 text-sm">
                                            {new Date(day.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-2 text-center text-gray-600 text-sm">{day.orders}</td>
                                        <td className="py-2 text-end text-gray-900 text-sm font-medium">{day.revenue} ج.م</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
                {/* Profit by Order */}
<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
    الربح لكل طلب
</h3>
<table className="w-full mb-8">
    <thead>
        <tr className="border-b-2 border-gray-200">
            <th className="text-start text-xs text-gray-400 uppercase pb-2">الفاتورة</th>
            <th className="text-start text-xs text-gray-400 uppercase pb-2">العميل</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">الإيرادات</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">التكلفة</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">الربح</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">الهامش</th>
        </tr>
    </thead>
    <tbody>
        {data.profit_by_order.data.map((o, i) => (
            <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-500 text-sm font-mono">{o.invoice_number}</td>
                <td className="py-2 text-gray-900 text-sm">{o.customer_name}</td>
                <td className="py-2 text-end text-gray-600 text-sm">{o.revenue} ج.م</td>
                <td className="py-2 text-end text-gray-600 text-sm">{o.cost} ج.م</td>
                <td className="py-2 text-end text-gray-900 text-sm font-medium">{o.profit} ج.م</td>
                <td className="py-2 text-end text-sm font-medium">{o.margin}%</td>
            </tr>
        ))}
    </tbody>
</table>

{/* Payments History */}
<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
    سجل الدفعات
</h3>
<table className="w-full mb-8">
    <thead>
        <tr className="border-b-2 border-gray-200">
            <th className="text-start text-xs text-gray-400 uppercase pb-2">الفاتورة</th>
            <th className="text-start text-xs text-gray-400 uppercase pb-2">العميل</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">المبلغ</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">طريقة الدفع</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">الوقت</th>
        </tr>
    </thead>
    <tbody>
        {data.payments_history.data.map((p, i) => (
            <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-500 text-sm font-mono">{p.invoice_number}</td>
                <td className="py-2 text-gray-900 text-sm">{p.customer_name}</td>
                <td className="py-2 text-end text-gray-900 text-sm font-medium">{p.amount} ج.م</td>
                <td className="py-2 text-end text-gray-600 text-sm">{methodLabel[p.method] ?? p.method}</td>
                <td className="py-2 text-end text-gray-500 text-sm">
                    {new Date(p.paid_at).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'Africa/Cairo'
                    })}
                </td>
            </tr>
        ))}
    </tbody>
</table>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-4 text-center">
                    <p className="text-gray-400 text-xs">
                        {user.business_name} — تم إنشاؤه بواسطة ملتي دكان
                    </p>
                </div>
            </div>
        </>
    )
}