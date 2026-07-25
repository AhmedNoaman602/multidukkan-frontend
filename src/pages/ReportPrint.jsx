import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

const methodLabel = {
    cash:          'Cash',
    bank_transfer: 'Bank Transfer',
    instapay:      'Instapay',
    vodafone_cash: 'Vodafone Cash',
    orange_cash:   'Orange Cash',
    check:         'Check',
}

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
            <p className="text-red-500">Failed to load report</p>
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
                    ✕ Close
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    🖨️ Print / Save as PDF
                </button>
            </div>

            {/* Report */}
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-10 mb-10 text-gray-900">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.business_name}</h1>
                        <p className="text-gray-500 text-sm mt-1">Sales Report</p>
                    </div>
                    <div className="text-end">
                        <p className="text-gray-500 text-sm">
                            {from === to ? from : `${from} → ${to}`}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            Printed: {new Date().toLocaleDateString('en-GB')}
                        </p>
                    </div>
                </div>

                <hr className="border-gray-200 mb-6" />

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Revenue',   value: `${data.summary.total_revenue} EGP` },
                        { label: 'Total Collected', value: `${data.summary.total_collected} EGP` },
                        { label: 'Outstanding',     value: `${data.summary.outstanding} EGP` },
                        { label: 'Gross Profit',    value: `${data.summary.gross_profit} EGP` },
                    ].map(stat => (
                        <div key={stat.label} className="border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Orders by Customer */}
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Orders by Customer
                </h3>
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-start text-xs text-gray-400 uppercase pb-2">Customer</th>
                            <th className="text-center text-xs text-gray-400 uppercase pb-2">Orders</th>
                            <th className="text-end text-xs text-gray-400 uppercase pb-2">Total</th>
                            <th className="text-end text-xs text-gray-400 uppercase pb-2">Collected</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.orders_by_customer.data.map((c, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-2 text-gray-900 text-sm">{c.customer_name}</td>
                                <td className="py-2 text-center text-gray-600 text-sm">{c.orders_count}</td>
                                <td className="py-2 text-end text-gray-600 text-sm">{c.total} EGP</td>
                                <td className="py-2 text-end text-gray-900 text-sm font-medium">{c.collected} EGP</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Daily Breakdown */}
                {data.daily_breakdown.total > 1 && (
                    <>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                            Daily Breakdown
                        </h3>
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-start text-xs text-gray-400 uppercase pb-2">Date</th>
                                    <th className="text-center text-xs text-gray-400 uppercase pb-2">Orders</th>
                                    <th className="text-end text-xs text-gray-400 uppercase pb-2">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.daily_breakdown.data.map((day, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-2 text-gray-900 text-sm">
                                            {new Date(day.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-2 text-center text-gray-600 text-sm">{day.orders}</td>
                                        <td className="py-2 text-end text-gray-900 text-sm font-medium">{day.revenue} EGP</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
                {/* Profit by Order */}
<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
    Profit by Order
</h3>
<table className="w-full mb-8">
    <thead>
        <tr className="border-b-2 border-gray-200">
            <th className="text-start text-xs text-gray-400 uppercase pb-2">Invoice</th>
            <th className="text-start text-xs text-gray-400 uppercase pb-2">Customer</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">Revenue</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">Cost</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">Profit</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">Margin</th>
        </tr>
    </thead>
    <tbody>
        {data.profit_by_order.data.map((o, i) => (
            <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-500 text-sm font-mono">{o.invoice_number}</td>
                <td className="py-2 text-gray-900 text-sm">{o.customer_name}</td>
                <td className="py-2 text-end text-gray-600 text-sm">{o.revenue} EGP</td>
                <td className="py-2 text-end text-gray-600 text-sm">{o.cost} EGP</td>
                <td className="py-2 text-end text-gray-900 text-sm font-medium">{o.profit} EGP</td>
                <td className="py-2 text-end text-sm font-medium">{o.margin}%</td>
            </tr>
        ))}
    </tbody>
</table>

{/* Payments History */}
<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
    Payments History
</h3>
<table className="w-full mb-8">
    <thead>
        <tr className="border-b-2 border-gray-200">
            <th className="text-start text-xs text-gray-400 uppercase pb-2">Invoice</th>
            <th className="text-start text-xs text-gray-400 uppercase pb-2">Customer</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">Amount</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">Method</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">Time</th>
        </tr>
    </thead>
    <tbody>
        {data.payments_history.data.map((p, i) => (
            <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-500 text-sm font-mono">{p.invoice_number}</td>
                <td className="py-2 text-gray-900 text-sm">{p.customer_name}</td>
                <td className="py-2 text-end text-gray-900 text-sm font-medium">{p.amount} EGP</td>
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
                        {user.business_name} — Generated by MultiDukkan
                    </p>
                </div>
            </div>
        </>
    )
}