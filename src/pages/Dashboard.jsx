// 1. Imports
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import QuickSaleModal from '../components/QuickSaleModal'
import { useToast } from '../hooks/useToast'
import {
    Banknote, ShoppingCart, Clock, Receipt, Users, Package,
    AlertTriangle, CheckCircle2, Plus, BarChart3, Zap, Inbox,
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
    const [stats, setStats] = useState(null)
    const [recentOrders, setRecentOrders] = useState([])
    const [topDebtors, setTopDebtors] = useState([])
    const [lowStockItems, setLowStockItems] = useState([])
    const [loading, setLoading] = useState(true)
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
    const navigate = useNavigate()

    // 5. Derived values — computed from state/props, no side effects
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const today = new Date().toLocaleDateString('en-CA')
    const todayFormatted = new Date().toLocaleDateString('en-EG', {
        weekday: 'long', month: 'long', day: 'numeric'
    })

    const getGreeting = () => {
        const hour = new Date().getHours()
        const day = new Date().getDay()
        if (day === 5) return 'جمعة مباركة،'
        if (hour < 5) return 'سهران لسه؟'
        if (hour < 9) return 'صباح الفل،'
        if (hour < 12) return 'صباح الخير،'
        if (hour < 14) return 'نهارك سعيد،'
        if (hour < 21) return 'مساء الخير،'
        return 'مساء النور،'
    }

    const getSubMessage = () => {
        if (stats?.todayRevenue > 2000) {
            return `🔥 أداء رائع اليوم! حققت مبيعات بقيمة ${stats.todayRevenue} جنيه حتى الآن`
        }
        if (stats?.unpaidOrders > 3) {
            return `⚠️ لديك ${stats.unpaidOrders} طلبات غير مسددة تحتاج إلى المتابعة`
        }
        if (stats?.lowStock > 0) {
            return `📦 يوجد ${stats.lowStock} منتجات أوشكت على النفاد وتحتاج إلى إعادة التوريد`
        }
        if (stats?.todayOrdersCount === 0) {
            return ' 🚀 لم يتم تسجيل أي طلبات اليوم بعد، نتمنى لك يوماً ناجحاً'
        }
        return ` إليك ملخص نشاط ${user.business_name} اليوم`
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

   useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await api.get('/dashboard')
            const d = res.data

            setStats({
                todayRevenue: Math.round(d.stats.today_revenue),
                todayPaymentsCount: d.stats.today_payments_count,
                todaySales: Math.round(d.stats.today_sales),
                todayOrdersCount: d.stats.today_orders_count,
                unpaidOrders: d.stats.unpaid_orders,
                totalOwed: Math.round(d.stats.total_owed),
                totalCustomers: d.stats.total_customers,
                totalProducts: d.stats.total_products,
                lowStock: d.stats.low_stock,
            })

            setRecentOrders(d.recent_orders)
            setTopDebtors(d.top_debtors)
            setLowStockItems(d.low_stock)

        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load dashboard', 'error')
        } finally {
            setLoading(false)
        }
    }
    fetchData()
}, [])

    if (loading) return <LoadingSpinner />

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
                        {/* {getGreeting()} يا  */}
                        Good day, {user.name}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {/* {getSubMessage()} */}
                        Welcome back to your dashboard! Here's a quick overview of your business performance and insights for today.
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
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* PRIMARY — Today's performance */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Today</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard
                        label="Revenue collected"
                        value={stats.todayRevenue > 0 ? stats.todayRevenue.toLocaleString() : '—'}
                        unit={stats.todayRevenue > 0 ? 'EGP' : null}
                        sub={stats.todayRevenue > 0
                            ? `${stats.todayPaymentsCount} payment${stats.todayPaymentsCount !== 1 ? 's' : ''}`
                            : 'No sales yet today'}
                        icon={Banknote}
                        chip="bg-green-500/10 border-green-500/30 text-green-400"
                        onClick={user.role === 'tenant_admin' ? () => navigate('/reports') : undefined}
                    />
                    <StatCard
                        label="New orders"
                        value={stats.todayOrdersCount > 0 ? stats.todayOrdersCount.toLocaleString() : '—'}
                        sub={stats.todayOrdersCount > 0
                            ? `${stats.todaySales.toLocaleString()} EGP in sales`
                            : 'No orders yet today'}
                        icon={ShoppingCart}
                        chip="bg-violet-500/10 border-violet-500/30 text-violet-400"
                        onClick={() => navigate('/orders')}
                    />
                    <StatCard
                        label="Unpaid orders"
                        value={stats.unpaidOrders.toLocaleString()}
                        sub={stats.unpaidOrders > 0 ? 'needs follow-up' : 'all settled ✓'}
                        icon={stats.unpaidOrders > 0 ? Clock : CheckCircle2}
                        chip={stats.unpaidOrders > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-gray-800/60 border-gray-700 text-gray-400'}
                        onClick={() => navigate('/orders')}
                    />
                    <StatCard
                        label="Total owed"
                        value={stats.totalOwed > 0 ? stats.totalOwed.toLocaleString() : '—'}
                        unit={stats.totalOwed > 0 ? 'EGP' : null}
                        sub={stats.totalOwed > 0 ? 'across all customers' : 'Nothing owed 🎉'}
                        icon={Receipt}
                        chip="bg-red-500/10 border-red-500/30 text-red-400"
                        onClick={() => navigate('/customers')}
                    />
                </div>
            </div>

            {/* SECONDARY — Business overview */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Overview</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <StatCard
                        label="Total customers"
                        value={stats.totalCustomers > 0 ? stats.totalCustomers.toLocaleString() : '—'}
                        sub={stats.totalCustomers > 0 ? null : 'Add your first customer'}
                        icon={Users}
                        chip="bg-purple-500/10 border-purple-500/30 text-purple-400"
                        onClick={() => navigate('/customers')}
                    />
                    <StatCard
                        label="Total products"
                        value={stats.totalProducts > 0 ? stats.totalProducts.toLocaleString() : '—'}
                        sub={stats.totalProducts > 0 ? null : 'Add your first product'}
                        icon={Package}
                        chip="bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        onClick={() => navigate('/products')}
                    />
                    <StatCard
                        label="Low stock alert"
                        value={stats.lowStock.toLocaleString()}
                        sub={stats.lowStock > 0 ? 'tap to review' : 'all stocked ✓'}
                        icon={stats.lowStock > 0 ? AlertTriangle : CheckCircle2}
                        chip={stats.lowStock > 0 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}
                        onClick={() => navigate('/inventory?low_stock=1')}
                    />
                </div>
            </div>

            {/* Quick actions */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Quick Actions</p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => navigate('/orders/create')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors duration-150 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    >
                        <Plus size={15} strokeWidth={2} />
                        New Order
                    </button>
                    <button
                        onClick={() => navigate('/customers/create')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    >
                        <Plus size={15} strokeWidth={2} />
                        Add Customer
                    </button>
                    {user.role === 'tenant_admin' && (
                        <>
                            <button
                                onClick={() => navigate('/products/create')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                            >
                                <Plus size={15} strokeWidth={2} />
                                Add Product
                            </button>
                            <button
                                onClick={() => navigate('/reports')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                            >
                                <BarChart3 size={15} strokeWidth={2} />
                                View Reports
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
                        {/* ⚡ بيع سريع */}
                        <Zap size={15} strokeWidth={2} />
                        Quick Sale
                    </button>
                </div>
            </div>
{/* AI Insights */}
 {user.role === 'tenant_admin' && (
    <div>
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">AI Insights</p>
                <span className="text-xs px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded-full">آخر 30 يوم</span>
                {insightsFetched && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/15 text-green-400 rounded-full">✓ محدّث</span>
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
                        جاري التحليل...
                    </>
                ) : insightsFetched ? (
                    <>🔄 تحديث</>
                ) : (
                    <>✨ تحليل المبيعات</>
                )}
            </button>
        </div>

        <div className="bg-gray-900 border border-purple-500/20 rounded-2xl overflow-hidden">
            {!insightsFetched && !loadingInsights && (
                <div className="text-center py-10">
                    <div className="text-4xl mb-3">🤖</div>
                    <p className="text-gray-300 text-sm font-medium mb-1">تحليل ذكي لمبيعاتك</p>
                    <p className="text-gray-600 text-xs mb-4">اضغط على "تحليل المبيعات" للحصول على رؤى مخصصة لمتجرك</p>
                    <button
                        onClick={fetchInsights}
                        disabled={loadingInsights}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        ✨ تحليل المبيعات الآن
                    </button>
                </div>
            )}

            {loadingInsights && (
                <div className="text-center py-10">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-purple-400 text-sm">جاري تحليل بيانات المبيعات...</p>
                    <p className="text-gray-600 text-xs mt-1">قد يستغرق هذا بضع ثوانٍ</p>
                </div>
            )}

            {insights && !loadingInsights && (
    <div className="p-5">
        {insights.no_data ? (
            <div className="text-center py-6">
                <div className="text-3xl mb-3">📊</div>
                <p className="text-gray-300 text-sm font-medium mb-1">لا توجد بيانات كافية</p>
                <p className="text-gray-600 text-xs">{insights.message}</p>
            </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                {
                    key: 'opportunity',
                    label: 'OPPORTUNITY',
                    icon: '💡',
                    color: 'green',
                    border: 'border-green-500/20',
                    bg: 'bg-green-500/5',
                    badge: 'bg-green-500/20 text-green-400',
                },
                {
                    key: 'urgent',
                    label: 'URGENT',
                    icon: '⚠️',
                    color: 'red',
                    border: 'border-red-500/20',
                    bg: 'bg-red-500/5',
                    badge: 'bg-red-500/20 text-red-400',
                },
                {
                    key: 'trend',
                    label: 'TREND',
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
                                {card.icon} {card.label}
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
            <p className="text-gray-600 text-xs">تم التحليل بواسطة الذكاء الاصطناعي</p>
            <button
                onClick={() => { setInsightsFetched(false); setInsights(null); fetchInsights() }}
                className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
            >
                🔄 تحديث التحليل
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
                            <p className="text-white text-sm font-semibold">Recent orders</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                                {recentOrders.length} orders · today and recent
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/orders')}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-150"
                        >
                            View all →
                        </button>
                    </div>

                        {/* Filter tabs */}
                        <div className="flex items-center px-4 py-3">
                            <div className="flex items-center gap-0.5 bg-gray-950/60 border border-gray-800 rounded-lg p-0.5">
                                {[
                                    { label: 'All', value: 'all', count: recentOrders.length },
                                    { label: 'Paid', value: 'paid', count: recentOrders.filter(o => o.status === 'paid').length },
                                    { label: 'Unpaid', value: 'unpaid', count: recentOrders.filter(o => o.status === 'unpaid').length },
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
                                <p className="text-gray-500 text-sm mb-2">No orders yet</p>
                                <button
                                    onClick={() => navigate('/orders/create')}
                                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-150"
                                >
                                    Create your first order →
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
                                            { h: 'Invoice', align: 'text-start' },
                                            { h: 'Customer', align: 'text-start' },
                                            { h: 'Items', align: 'text-end' },
                                            { h: 'Total', align: 'text-end' },
                                            { h: 'Balance', align: 'text-end' },
                                            { h: 'Status', align: 'text-start' },
                                            { h: 'Time', align: 'text-end' },
                                        ].map(col => (
                                            <th key={col.h} className={`px-2 py-2.5 ${col.align} text-[11px] font-medium text-gray-500 uppercase tracking-wider`}>
                                                {col.h}
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
                                                    {Number(order.total).toLocaleString()} <span className="text-gray-500 text-xs font-normal">EGP</span>
                                                </td>
                                                <td className="px-2 py-3 text-sm font-medium text-end tabular-nums">
                                                    {order.amount_remaining > 0
                                                        ? <span className="text-red-400 whitespace-nowrap">-{Number(order.amount_remaining).toLocaleString()}</span>
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
                                                        {order.status === 'paid' ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-3 text-gray-500 text-xs text-end whitespace-nowrap">
                                                    {new Date(order.order_date ?? order.created_at).toLocaleDateString('en-GB', {
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
                            {topDebtors.length > 0 ? 'Top debtors' : 'Low stock items'}
                        </p>
                        <button
                            onClick={() => navigate(topDebtors.length > 0 ? '/customers' : '/inventory')}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-150"
                        >
                            View all →
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
                                                <p className="text-gray-500 text-xs">{debtor.unpaid_orders_count} unpaid order{debtor.unpaid_orders_count !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <p className="text-red-400 text-sm font-semibold shrink-0 tabular-nums">
                                            {Math.round(debtor.balance).toLocaleString()} <span className="text-gray-500 text-xs font-normal">EGP</span>
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
                                            <p className="text-orange-400 text-sm font-semibold tabular-nums">{item.quantity} left</p>
                                            <p className="text-gray-500 text-xs tabular-nums">threshold: {item.threshold}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-12">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-green-400 mb-3">
                                    <CheckCircle2 size={18} strokeWidth={1.75} />
                                </span>
                                <p className="text-gray-500 text-sm">All good!</p>
                                <p className="text-gray-600 text-xs mt-1">No debts, no low stock</p>
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
