// 1. Imports
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import QuickSaleModal from '../components/QuickSaleModal'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, formatDate, formatNumber } from '../lib/format'
import {
    Banknote, ShoppingCart, Clock, Receipt, Users, Package,
    AlertTriangle, CheckCircle2, Plus, BarChart3, Zap, Inbox,
    ChevronLeft, ChevronRight,
} from 'lucide-react'

// 2. Constants — small reusable sub-component used only by this file
const StatCard = ({ label, value, unit, sub, icon, chip, onClick }) => {
    const Icon = icon
    return (
    <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
        className={`rounded-2xl border border-gray-800 bg-gray-900 p-4 sm:p-5 transition-colors duration-150 outline-none ${onClick ? 'cursor-pointer hover:border-gray-700 hover:bg-gray-900/80 focus-visible:ring-2 focus-visible:ring-blue-500/40' : ''}`}
    >
        <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium text-gray-400 mt-1">{label}</p>
            <span className={`flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 ${chip}`}>
                <Icon size={16} strokeWidth={1.75} />
            </span>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">
            {value}
            {unit && <span className="ms-1.5 text-sm font-normal text-gray-500">{unit}</span>}
        </p>
        {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
    </div>
    )
}

// 3. Component
export default function Dashboard() {

    // 4. Hooks — state, router, toast
    const [insights, setInsights] = useState('')
    const [loadingInsights, setLoadingInsights] = useState(false)
    const [insightsFetched, setInsightsFetched] = useState(false)
    const [activePeriod, setActivePeriod] = useState("Today")
    const [ordersFilter, setOrdersFilter] = useState('all')
    const [showQuickSale, setShowQuickSale] = useState(false)
    const [products, setProducts] = useState([])
    const [warehouses, setWarehouses] = useState([])
    const [inventory, setInventory] = useState([])
    const { showToast } = useToast()
    const { t, lang, dir } = useTranslation()
    const navigate = useNavigate()

    // 5. Derived values — computed from state/props, no side effects
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    // en-CA gives the ISO shape the API expects — not a display value, keep as is.
    const today = new Date().toLocaleDateString('en-CA')
    const todayFormatted = formatDate(new Date(), lang, {
        weekday: 'long', month: 'long', day: 'numeric'
    })

    // "View all" style links point along the reading direction.
    const ForwardIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    const getGreeting = () => {
        const hour = new Date().getHours()
        const day = new Date().getDay()
        if (day === 5) return t('dashboard.greetings.friday')
        if (hour < 5) return t('dashboard.greetings.lateNight')
        if (hour < 9) return t('dashboard.greetings.earlyMorning')
        if (hour < 12) return t('dashboard.greetings.morning')
        if (hour < 14) return t('dashboard.greetings.midday')
        if (hour < 21) return t('dashboard.greetings.evening')
        return t('dashboard.greetings.night')
    }

    const getSubMessage = () => {
        if (stats?.todayRevenue > 2000) {
            return t('dashboard.sub.greatRevenue', { amount: formatCurrency(stats.todayRevenue, lang) })
        }
        if (stats?.unpaidOrders > 3) {
            return t('dashboard.sub.unpaidOrders', { count: stats.unpaidOrders })
        }
        if (stats?.lowStock > 0) {
            return t('dashboard.sub.lowStock', { count: stats.lowStock })
        }
        if (stats?.todayOrdersCount === 0) {
            return t('dashboard.sub.noOrders')
        }
        return t('dashboard.sub.default', { business: user.business_name })
    }

    // 6. Event handlers — triggered by user interaction (buttons, clicks)
    const fetchInsights = async () => {
        if (insightsFetched) return
        setLoadingInsights(true)
        try {
            const res = await api.get('/ai/insights')
            setInsights(res.data)
            setInsightsFetched(true)
        } catch {
            setInsights(null)
        } finally {
            setLoadingInsights(false)
        }
    }

    const fetchQuickSaleData = async () => {
        if (products.length > 0) return
        const [productsRes, inventoryRes, warehousesRes] = await Promise.all([
            api.get('/products?per_page=all'),
            api.get('/inventory?per_page=all'),
            api.get('/warehouses'),
        ])
        setProducts(productsRes.data.data)
        setInventory(inventoryRes.data.data)
        setWarehouses(warehousesRes.data.data)
    }

    // 7. Effects — run on mount / dependency change
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const { data: dashboard, isLoading, isError } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api.get('/dashboard').then(res => res.data),
    })

    useEffect(() => {
        if (isError) showToast(t('dashboard.loadFailed'), 'error')
    }, [isError, showToast, t])

    const stats = dashboard ? {
        todayRevenue: Math.round(dashboard.stats.today_revenue),
        todayPaymentsCount: dashboard.stats.today_payments_count,
        todaySales: Math.round(dashboard.stats.today_sales),
        todayOrdersCount: dashboard.stats.today_orders_count,
        unpaidOrders: dashboard.stats.unpaid_orders,
        totalOwed: Math.round(dashboard.stats.total_owed),
        totalCustomers: dashboard.stats.total_customers,
        totalProducts: dashboard.stats.total_products,
        lowStock: dashboard.stats.low_stock,
    } : null
    const recentOrders = dashboard?.recent_orders || []
    const topDebtors = dashboard?.top_debtors || []
    const lowStockItems = dashboard?.low_stock || []

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <p className="text-gray-500 text-sm">{todayFormatted}</p>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {/* {getGreeting()} */}
                        {t('dashboard.greetingWithName', { name: user.name })}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {/* {getSubMessage()} */}
                        {t('dashboard.intro')}
                    </p>
                </div>
                <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 self-start overflow-x-auto">
                    {['Today', 'Week', 'Month', 'Year'].map(period => (
                        <button
                            key={period}
                            onClick={() => setActivePeriod(period)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                                activePeriod === period
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {t(`dashboard.periods.${period}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* PRIMARY — Today's performance */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t('dashboard.sections.today')}</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard
                        label={t('dashboard.stats.revenue')}
                        value={stats.todayRevenue > 0 ? formatNumber(stats.todayRevenue) : '—'}
                        unit={stats.todayRevenue > 0 ? t('common.currency') : null}
                        sub={stats.todayRevenue > 0
                            ? t('common.paymentsCount', { count: stats.todayPaymentsCount })
                            : t('dashboard.stats.noSalesYet')}
                        icon={Banknote}
                        chip="bg-green-500/10 border-green-500/30 text-green-400"
                        onClick={user.role === 'tenant_admin' ? () => navigate('/reports') : undefined}
                    />
                    <StatCard
                        label={t('dashboard.stats.newOrders')}
                        value={stats.todayOrdersCount > 0 ? formatNumber(stats.todayOrdersCount) : '—'}
                        sub={stats.todayOrdersCount > 0
                            ? t('dashboard.stats.sales', { amount: formatCurrency(stats.todaySales, lang) })
                            : t('dashboard.stats.noOrdersYet')}
                        icon={ShoppingCart}
                        chip="bg-violet-500/10 border-violet-500/30 text-violet-400"
                        onClick={() => navigate('/orders')}
                    />
                    <StatCard
                        label={t('dashboard.stats.unpaidOrders')}
                        value={formatNumber(stats.unpaidOrders)}
                        sub={stats.unpaidOrders > 0 ? t('dashboard.stats.needsFollowUp') : t('dashboard.stats.allSettled')}
                        icon={stats.unpaidOrders > 0 ? Clock : CheckCircle2}
                        chip={stats.unpaidOrders > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-gray-800/60 border-gray-700 text-gray-400'}
                        onClick={() => navigate('/orders')}
                    />
                    <StatCard
                        label={t('dashboard.stats.totalOwed')}
                        value={stats.totalOwed > 0 ? formatNumber(stats.totalOwed) : '—'}
                        unit={stats.totalOwed > 0 ? t('common.currency') : null}
                        sub={stats.totalOwed > 0 ? t('dashboard.stats.acrossAllCustomers') : t('dashboard.stats.noDues')}
                        icon={Receipt}
                        chip="bg-red-500/10 border-red-500/30 text-red-400"
                        onClick={() => navigate('/customers')}
                    />
                </div>
            </div>

            {/* SECONDARY — Business overview */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t('dashboard.sections.overview')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <StatCard
                        label={t('dashboard.stats.totalCustomers')}
                        value={stats.totalCustomers > 0 ? formatNumber(stats.totalCustomers) : '—'}
                        sub={stats.totalCustomers > 0 ? null : t('dashboard.stats.addFirstCustomer')}
                        icon={Users}
                        chip="bg-purple-500/10 border-purple-500/30 text-purple-400"
                        onClick={() => navigate('/customers')}
                    />
                    <StatCard
                        label={t('dashboard.stats.totalProducts')}
                        value={stats.totalProducts > 0 ? formatNumber(stats.totalProducts) : '—'}
                        sub={stats.totalProducts > 0 ? null : t('dashboard.stats.addFirstProduct')}
                        icon={Package}
                        chip="bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        onClick={() => navigate('/products')}
                    />
                    <StatCard
                        label={t('dashboard.stats.lowStockAlert')}
                        value={formatNumber(stats.lowStock)}
                        sub={stats.lowStock > 0 ? t('dashboard.stats.tapToReview') : t('dashboard.stats.stockHealthy')}
                        icon={stats.lowStock > 0 ? AlertTriangle : CheckCircle2}
                        chip={stats.lowStock > 0 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}
                        onClick={() => navigate('/inventory?low_stock=1')}
                    />
                </div>
            </div>

            {/* Quick actions */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{t('dashboard.sections.quickActions')}</p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => navigate('/orders/create')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors duration-150 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    >
                        <Plus size={15} strokeWidth={2} />
                        {t('dashboard.actions.newOrder')}
                    </button>
                    <button
                        onClick={() => navigate('/customers/create')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    >
                        <Plus size={15} strokeWidth={2} />
                        {t('dashboard.actions.addCustomer')}
                    </button>
                    {user.role === 'tenant_admin' && (
                        <>
                            <button
                                onClick={() => navigate('/products/create')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                            >
                                <Plus size={15} strokeWidth={2} />
                                {t('dashboard.actions.addProduct')}
                            </button>
                            <button
                                onClick={() => navigate('/reports')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                            >
                                <BarChart3 size={15} strokeWidth={2} />
                                {t('dashboard.actions.viewReports')}
                            </button>
                        </>
                    )}
                    <button
                        onClick={async () => {
                            await fetchQuickSaleData()
                            setShowQuickSale(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-green-500/40"
                    >
                        <Zap size={15} strokeWidth={2} />
                        {t('common.quickSale')}
                    </button>
                </div>
            </div>
{/* AI Insights */}
 {user.role === 'tenant_admin' && (
    <div>
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{t('dashboard.sections.aiInsights')}</p>
                <span className="text-xs px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded-full">{t('dashboard.ai.last30Days')}</span>
                {insightsFetched && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/15 text-green-400 rounded-full">{t('dashboard.ai.updated')}</span>
                )}
            </div>
            <button
                onClick={fetchInsights}
                disabled={loadingInsights}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 disabled:opacity-40 text-xs font-medium rounded-lg transition-colors"
            >
                {loadingInsights ? (
                    <>
                        <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        {t('dashboard.ai.analyzing')}
                    </>
                ) : insightsFetched ? (
                    t('dashboard.ai.refresh')
                ) : (
                    t('dashboard.ai.analyzeSales')
                )}
            </button>
        </div>

        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl overflow-hidden">
            {!insightsFetched && !loadingInsights && (
                <div className="text-center py-10">
                    <div className="text-4xl mb-3">🤖</div>
                    <p className="text-gray-300 text-sm font-medium mb-1">{t('dashboard.ai.emptyTitle')}</p>
                    <p className="text-gray-600 text-xs mb-4">{t('dashboard.ai.emptyBody')}</p>
                    <button
                        onClick={fetchInsights}
                        disabled={loadingInsights}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        {t('dashboard.ai.analyzeNow')}
                    </button>
                </div>
            )}

            {loadingInsights && (
                <div className="text-center py-10">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-purple-400 text-sm">{t('dashboard.ai.loading')}</p>
                    <p className="text-gray-600 text-xs mt-1">{t('dashboard.ai.loadingHint')}</p>
                </div>
            )}

            {insights && !loadingInsights && (
    <div className="p-5">
        {insights.no_data ? (
            <div className="text-center py-6">
                <div className="text-3xl mb-3">📊</div>
                <p className="text-gray-300 text-sm font-medium mb-1">{t('dashboard.ai.noData')}</p>
                <p className="text-gray-600 text-xs">{insights.message}</p>
            </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                {
                    key: 'opportunity',
                    icon: '💡',
                    color: 'green',
                    border: 'border-green-500/20',
                    bg: 'bg-green-500/5',
                    badge: 'bg-green-500/20 text-green-400',
                },
                {
                    key: 'urgent',
                    icon: '⚠️',
                    color: 'red',
                    border: 'border-red-500/20',
                    bg: 'bg-red-500/5',
                    badge: 'bg-red-500/20 text-red-400',
                },
                {
                    key: 'trend',
                    icon: '📈',
                    color: 'blue',
                    border: 'border-blue-500/20',
                    bg: 'bg-blue-500/5',
                    badge: 'bg-blue-500/20 text-blue-400',
                },
            ].map(card => (
                insights[card.key]?.title && (
                    <div key={card.key} className={`rounded-xl border ${card.border} ${card.bg} p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.badge}`}>
                                {card.icon} {t(`dashboard.ai.cards.${card.key}`)}
                            </span>
                        </div>
                        <p className="text-white text-sm font-semibold mb-2 text-end">
                            {insights[card.key].title}
                        </p>
                        <p className="text-gray-400 text-xs leading-relaxed text-end">
                            {insights[card.key].body}
                        </p>
                    </div>
                )
            ))}
        </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-gray-600 text-xs">{t('dashboard.ai.footer')}</p>
            <button
                onClick={() => { setInsightsFetched(false); setInsights(null); fetchInsights() }}
                className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
            >
                {t('dashboard.ai.refreshAnalysis')}
            </button>
        </div>
    </div>
)}
        </div>
    </div>
)} 
            {/* Two-column info panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Recent Orders */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden self-start">
                    <div className="flex items-start justify-between px-4 pt-4">
                        <div>
                            <p className="text-white text-sm font-semibold">{t('dashboard.recentOrders.title')}</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                                {t('dashboard.recentOrders.subtitle', { count: recentOrders.length })}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/orders')}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-150"
                        >
                            {t('common.viewAll')}
                            <ForwardIcon size={14} />
                        </button>
                    </div>

                        {/* Filter tabs */}
                        <div className="flex items-center px-4 py-3">
                            <div className="flex items-center gap-0.5 bg-gray-950/60 border border-gray-800 rounded-lg p-0.5">
                                {[
                                    { label: t('common.all'), value: 'all', count: recentOrders.length },
                                    { label: t('enums.orderStatus.paid'), value: 'paid', count: recentOrders.filter(o => o.status === 'paid').length },
                                    { label: t('enums.orderStatus.unpaid'), value: 'unpaid', count: recentOrders.filter(o => o.status === 'unpaid').length },
                                ].map(tab => (
                                    <button
                                        key={tab.value}
                                        onClick={() => setOrdersFilter(tab.value)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                                            ordersFilter === tab.value
                                                ? 'bg-white text-gray-900'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                        <span className={`tabular-nums ${
                                            ordersFilter === tab.value ? 'text-gray-500' : 'text-gray-600'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center py-12">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-500 mb-3">
                                    <Inbox size={18} strokeWidth={1.75} />
                                </span>
                                <p className="text-gray-500 text-sm mb-2">{t('dashboard.recentOrders.empty')}</p>
                                <button
                                    onClick={() => navigate('/orders/create')}
                                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-150"
                                >
                                    {t('dashboard.recentOrders.createFirst')}
                                    <ForwardIcon size={15} />
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                            <table className="w-full table-fixed">
                                <colgroup>
                                    <col className="w-16" />
                                    <col className="w-28" />
                                    <col className="w-12" />
                                    <col className="w-20" />
                                    <col className="w-20" />
                                    <col className="w-20" />
                                    <col className="w-24" />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        {[
                                            { key: 'common.invoice', align: 'text-start' },
                                            { key: 'common.customer', align: 'text-start' },
                                            { key: 'common.items', align: 'text-end' },
                                            { key: 'common.total', align: 'text-end' },
                                            { key: 'common.remaining', align: 'text-end' },
                                            { key: 'common.status', align: 'text-start' },
                                            { key: 'common.time', align: 'text-end' },
                                        ].map(col => (
                                            <th key={col.key} className={`px-2 py-2.5 ${col.align} text-[11px] font-medium text-gray-500 uppercase tracking-wider`}>
                                                {t(col.key)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/60">

                                    {recentOrders
                                        .filter(o => ordersFilter === 'all' || o.status === ordersFilter)
                                        .map(order => (

                                            <tr
                                                key={order.id}
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                className="hover:bg-gray-800/50 transition-colors duration-150 cursor-pointer"
                                            >
                                                <td className="px-2 py-3 text-gray-500 text-xs font-mono">
                                                    #{order.id}
                                                </td>
                                                <td className="px-2 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded-md bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                                                            {order.customer_name?.charAt(0) ?? '?'}
                                                        </div>
                                                        <p className="text-white text-sm font-medium truncate">{order.customer_name}</p>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3 text-gray-400 text-sm text-end tabular-nums">
                                                    {order.items_count}
                                                </td>
                                                <td className="px-2 py-3 text-white text-sm font-medium text-end tabular-nums">
                                                    {formatNumber(order.total)} <span className="text-gray-500 text-xs font-normal">{t('common.currency')}</span>
                                                </td>
                                                <td className="px-2 py-3 text-sm font-medium text-end tabular-nums">
                                                    {order.amount_remaining > 0
                                                        ? <span className="text-red-400 whitespace-nowrap">-{formatNumber(order.amount_remaining)}</span>
                                                        : <span className="text-gray-600">0</span>
                                                    }
                                                </td>
                                                <td className="px-2 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                                                        order.status === 'paid'
                                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                            order.status === 'paid' ? 'bg-green-400' : 'bg-amber-400'
                                                        }`} />
                                                        {t(`enums.orderStatus.${order.status}`)}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-3 text-gray-500 text-xs text-end whitespace-nowrap">
                                                    {formatDate(order.order_date ?? order.created_at, lang, {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))}

                                </tbody>
                            </table>
                            </div>
                        )}
                </div>

                {/* Top debtors OR Low stock */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden self-start">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                        <p className="text-white text-sm font-semibold">
                            {topDebtors.length > 0 ? t('dashboard.panel.topDebtors') : t('dashboard.panel.lowStock')}
                        </p>
                        <button
                            onClick={() => navigate(topDebtors.length > 0 ? '/customers' : '/inventory')}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-150"
                        >
                            {t('common.viewAll')}
                            <ForwardIcon size={14} />
                        </button>
                    </div>

                    <div className="border-t border-gray-800">
                        {topDebtors.length > 0 ? (
                            <div className="divide-y divide-gray-800">
                                {topDebtors.map((debtor, i) => (
                                    <div
                                        key={debtor.id}
                                        onClick={() => navigate(`/customers/${debtor.id}/balance`)}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors duration-150 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                                                i === 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-800 text-gray-500'
                                            }`}>
                                                #{i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{debtor.name}</p>
                                                <p className="text-gray-500 text-xs">{t('dashboard.panel.unpaidOrdersCount', { count: debtor.unpaid_orders_count })}</p>
                                            </div>
                                        </div>
                                        <p className="text-red-400 text-sm font-semibold shrink-0 tabular-nums">
                                            {formatNumber(Math.round(debtor.balance))} <span className="text-gray-500 text-xs font-normal">{t('common.currency')}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : lowStockItems.length > 0 ? (
                            <div className="divide-y divide-gray-800">
                                {lowStockItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => navigate('/inventory')}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors duration-150 cursor-pointer"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{item.product_name}</p>
                                            <p className="text-gray-500 text-xs">{item.warehouse_name}</p>
                                        </div>
                                        <div className="text-end shrink-0">
                                            <p className="text-orange-400 text-sm font-semibold tabular-nums">{t('dashboard.panel.left', { count: item.quantity })}</p>
                                            <p className="text-gray-500 text-xs tabular-nums">{t('dashboard.panel.threshold', { count: item.threshold })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-12">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-green-400 mb-3">
                                    <CheckCircle2 size={18} strokeWidth={1.75} />
                                </span>
                                <p className="text-gray-500 text-sm">{t('dashboard.panel.allGood')}</p>
                                <p className="text-gray-600 text-xs mt-1">{t('dashboard.panel.allGoodSub')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showQuickSale && (
    <QuickSaleModal
        open={showQuickSale}
        onClose={() => setShowQuickSale(false)}
        products={products}
        warehouses={warehouses}
         inventory={inventory}
        storeId={user.store_id}
    />
)}
        </div>
    )
}
