import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, formatDate } from '../lib/format'

function formatNetProfitPrint(netProfit, lang) {
    const v = netProfit ?? 0
    const formatted = formatCurrency(Math.abs(v), lang)
    return v < 0 ? `(${formatted})` : formatted
}

export default function ReportPrint() {
    const [searchParams] = useSearchParams()
    const from = searchParams.get('from')
    const to   = searchParams.get('to')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const { t, lang } = useTranslation()

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
            <p className="text-red-500">{t('reports.print.loadFailed')}</p>
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
                    {t('common.closeWindow')}
                </button>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {t('common.printOrSavePdf')}
                </button>
            </div>

            {/* Report */}
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-10 mb-10 text-gray-900">

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.business_name}</h1>
                        <p className="text-gray-500 text-sm mt-1">{t('reports.print.salesReport')}</p>
                    </div>
                    <div className="text-end">
                        <p className="text-gray-500 text-sm">
                            {from === to ? from : t('reports.print.dateRange', { from, to })}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            {t('reports.print.printedOn', { date: formatDate(new Date(), lang) })}
                        </p>
                    </div>
                </div>

                <hr className="border-gray-200 mb-6" />

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: t('orders.list.totalRevenue'),      value: formatCurrency(data.summary.total_revenue, lang) },
                        { label: t('reports.print.totalCollected'),  value: formatCurrency(data.summary.total_collected, lang) },
                        { label: t('reports.print.outstanding'),     value: formatCurrency(data.summary.outstanding, lang) },
                        { label: t('orders.detail.totalProfit'),     value: formatCurrency(data.summary.gross_profit, lang) },
                        { label: t('reports.print.totalExpenses'),   value: formatCurrency(data.summary.total_expenses ?? 0, lang) },
                        { label: t('reports.print.netProfit'),       value: formatNetProfitPrint(data.summary.net_profit, lang) },
                    ].map(stat => (
                        <div key={stat.label} className="border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Orders by Customer */}
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    {t('reports.print.ordersByCustomer')}
                </h3>
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-start text-xs text-gray-400 uppercase pb-2">{t('common.customer')}</th>
                            <th className="text-center text-xs text-gray-400 uppercase pb-2">{t('reports.print.ordersCount')}</th>
                            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('common.total')}</th>
                            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('reports.print.collected')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.orders_by_customer.data.map((c, i) => (
                            <tr key={i} className="border-b border-gray-100">
                                <td className="py-2 text-gray-900 text-sm">{c.customer_name}</td>
                                <td className="py-2 text-center text-gray-600 text-sm">{c.orders_count}</td>
                                <td className="py-2 text-end text-gray-600 text-sm">{formatCurrency(c.total, lang)}</td>
                                <td className="py-2 text-end text-gray-900 text-sm font-medium">{formatCurrency(c.collected, lang)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Daily Breakdown */}
                {data.daily_breakdown.total > 1 && (
                    <>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                            {t('reports.print.dailyBreakdown')}
                        </h3>
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-start text-xs text-gray-400 uppercase pb-2">{t('common.date')}</th>
                                    <th className="text-center text-xs text-gray-400 uppercase pb-2">{t('reports.print.ordersCount')}</th>
                                    <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('orders.detail.revenue')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.daily_breakdown.data.map((day, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-2 text-gray-900 text-sm">
                                            {formatDate(day.date, lang)}
                                        </td>
                                        <td className="py-2 text-center text-gray-600 text-sm">{day.orders}</td>
                                        <td className="py-2 text-end text-gray-900 text-sm font-medium">{formatCurrency(day.revenue, lang)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
                {/* Profit by Order */}
<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
    {t('reports.print.profitByOrder')}
</h3>
<table className="w-full mb-8">
    <thead>
        <tr className="border-b-2 border-gray-200">
            <th className="text-start text-xs text-gray-400 uppercase pb-2">{t('common.invoice')}</th>
            <th className="text-start text-xs text-gray-400 uppercase pb-2">{t('common.customer')}</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('orders.detail.revenue')}</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('orders.detail.cost')}</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('reports.print.profit')}</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('reports.print.margin')}</th>
        </tr>
    </thead>
    <tbody>
        {data.profit_by_order.data.map((o, i) => (
            <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-500 text-sm font-mono">{o.invoice_number}</td>
                <td className="py-2 text-gray-900 text-sm">{o.customer_name}</td>
                <td className="py-2 text-end text-gray-600 text-sm">{formatCurrency(o.revenue, lang)}</td>
                <td className="py-2 text-end text-gray-600 text-sm">{formatCurrency(o.cost, lang)}</td>
                <td className="py-2 text-end text-gray-900 text-sm font-medium">{formatCurrency(o.profit, lang)}</td>
                <td className="py-2 text-end text-sm font-medium">{o.margin}%</td>
            </tr>
        ))}
    </tbody>
</table>

{/* Expenses by Category */}
<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
    {t('reports.print.expensesByCategory')}
</h3>
{data.expenses_by_category?.length > 0 ? (
    <table className="w-full mb-8">
        <thead>
            <tr className="border-b-2 border-gray-200">
                <th className="text-start text-xs text-gray-400 uppercase pb-2">{t('reports.print.category')}</th>
                <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('common.amount')}</th>
            </tr>
        </thead>
        <tbody>
            {data.expenses_by_category.map((item) => (
                <tr key={item.category} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900 text-sm">{t(`enums.expenseCategory.${item.category}`)}</td>
                    <td className="py-2 text-end text-gray-900 text-sm font-medium">{formatCurrency(item.total, lang)}</td>
                </tr>
            ))}
        </tbody>
    </table>
) : (
    <p className="text-sm text-gray-400 mb-8">{t('reports.noExpenses')}</p>
)}

{/* Payments History */}
<h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
    {t('reports.print.paymentsHistory')}
</h3>
<table className="w-full mb-8">
    <thead>
        <tr className="border-b-2 border-gray-200">
            <th className="text-start text-xs text-gray-400 uppercase pb-2">{t('common.invoice')}</th>
            <th className="text-start text-xs text-gray-400 uppercase pb-2">{t('common.customer')}</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('common.amount')}</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('orders.payModal.method')}</th>
            <th className="text-end text-xs text-gray-400 uppercase pb-2">{t('common.time')}</th>
        </tr>
    </thead>
    <tbody>
        {data.payments_history.data.map((p, i) => (
            <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-500 text-sm font-mono">{p.invoice_number}</td>
                <td className="py-2 text-gray-900 text-sm">{p.customer_name}</td>
                <td className="py-2 text-end text-gray-900 text-sm font-medium">{formatCurrency(p.amount, lang)}</td>
                <td className="py-2 text-end text-gray-600 text-sm">{t(`enums.paymentMethod.${p.method}`)}</td>
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
                        {t('reports.print.generatedBy', { business: user.business_name })}
                    </p>
                </div>
            </div>
        </>
    )
}
