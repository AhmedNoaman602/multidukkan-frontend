import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import QuickSaleModal from '../components/QuickSaleModal'

// Reusable stat card component
const StatCard = ({ label, value, sub, icon, gradient, onClick, accent }) => (
    <div
        onClick={onClick}
        className={`group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br ${gradient} p-5 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-gray-700 hover:-translate-y-0.5' : ''}`}
    >
        {/* Decorative glow */}
        <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-10 ${accent}`} />

        <div className="relative">
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
        </div>
    </div>
)

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [recentOrders, setRecentOrders] = useState([])
    const [topDebtors, setTopDebtors] = useState([])
    const [lowStockItems, setLowStockItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [insights, setInsights] = useState('')
const [loadingInsights, setLoadingInsights] = useState(false)
const [insightsFetched, setInsightsFetched] = useState(false)
const [activePeriod , setActivePeriod] = useState("Today")
const [ordersFilter, setOrdersFilter] = useState('all')
const [showQuickSale, setShowQuickSale] = useState(false)
const [products, setProducts] = useState([])
const [warehouses, setWarehouses] = useState([])
const [inventory, setInventory] = useState([])

    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const getGreeting = () => {
    const hour = new Date().getHours()
    const day = new Date().getDay() // 0=Sunday, 5=Friday, 6=Saturday
    
    // Friday
    if (day === 5) return 'جمعة مباركة،'
    
    // Based on stats
    if (stats?.todayRevenue > 0) {
        const messages = [
            `شغل تمام،`,
            `أداء ممتاز النهارده`,
        ]
        return messages[Math.floor(Math.random() * messages.length)]
    }

    // Time based
    if (hour < 5)  return 'سهران لسه؟'
    if (hour < 9)  return 'صباح الفل،'
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

const today = new Date().toLocaleDateString('en-CA')    
const todayFormatted = new Date().toLocaleDateString('en-EG', {
        weekday: 'long', month: 'long', day: 'numeric'
    })

    useEffect(() => {
    window.scrollTo(0, 0)
}, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
               const [ordersRes, customersRes, productsRes, inventoryRes, paymentsRes, warehousesRes] = await Promise.all([
    api.get('/orders'),
    api.get('/customers'),
    api.get('/products?per_page=all'), 
    api.get('/inventory?per_page=all'), 
    api.get(`/payments?date=${today}`).catch(() => ({ data: { data: [], total: 0, count: 0 } })),
    api.get('/warehouses'),
])

                const orders = ordersRes.data.data || []
                const customers = customersRes.data.data || []
                const products = productsRes.data.data || []
                const inventory = inventoryRes.data.data || []
                const payments = paymentsRes.data

                // Today's revenue — handle both response shapes
                const todayRevenue = payments?.total
                    ?? (Array.isArray(payments?.data) ? payments.data.reduce((s, p) => s + parseFloat(p.amount || 0), 0) : 0)
                    ?? 0

                const todayPaymentsCount = payments?.count ?? payments?.data?.length ?? 0

                // Orders
                const unpaidOrders = orders.filter(o => o.status === 'unpaid')
                const totalOwed = unpaidOrders.reduce((sum, o) => sum + parseFloat(o.amount_remaining ?? o.total ?? 0), 0)
                // Today's orders
                const todayOrders = orders.filter(o =>
                    (o.order_date ?? new Date(o.created_at).toISOString().split('T')[0]) === today
                )
                const todaySales = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0)

                // Low stock
                const lowStock = inventory.filter(i => i.low_stock)

                // Top 3 debtors — group unpaid orders by customer
                const debtorMap = {}
                unpaidOrders.forEach(o => {
                    if (o.customer_name === 'Deleted Customer') return;
                    
                    if (!debtorMap[o.customer_id]) {
                        debtorMap[o.customer_id] = {
                            id: o.customer_id,
                            name: o.customer_name,
                            total: 0,
                            orders: 0
                        }
                    }
                    debtorMap[o.customer_id].total += parseFloat(o.amount_remaining ?? o.total ?? 0)
                    debtorMap[o.customer_id].orders += 1
                })
                const topDebtorsList = Object.values(debtorMap)
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 3)

                setStats({
                    todayRevenue: Math.round(todayRevenue),
                    todayPaymentsCount,
                    todaySales: Math.round(todaySales),
                    todayOrdersCount: todayOrders.length,
                    unpaidOrders: unpaidOrders.length,
                    totalOwed: Math.round(totalOwed),
                    totalCustomers: customers.length,
                    totalProducts: products.length,
                    lowStock: lowStock.length,
                })

                setRecentOrders(orders.slice(0, 5))
                setTopDebtors(topDebtorsList)
                setLowStockItems(lowStock.slice(0, 3))
                setProducts(productsRes.data.data)
                setWarehouses(warehousesRes.data.data)
                setInventory(inventoryRes.data.data)

            } catch (err) {
                console.error('Dashboard error:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <LoadingSpinner />

    const hasAlerts = stats?.lowStock > 0 || stats?.unpaidOrders > 0

    return (
        <div className="space-y-8">

            {/* Header */}
           <div className="flex items-start justify-between">
    <div>
        <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-gray-500 text-sm">{todayFormatted}</p>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight" dir="rtl">
     {getGreeting()} يا {user.name} 
        </h1>
        <p className="text-gray-500 text-sm mt-1" dir='rtl'>
            {getSubMessage()}
        </p>
    </div>
    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl p-1">
    {['Today', 'Week', 'Month', 'Year'].map(period => (
        <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
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
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-green-500 rounded-full" />
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Today</p>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <StatCard
                        label="Revenue Collected"
                        value={`${stats.todayRevenue} EGP`}
                        sub={`${stats.todayPaymentsCount} payment${stats.todayPaymentsCount !== 1 ? 's' : ''}`}
                        icon="💰"
                        gradient="from-green-500/10 to-gray-900"
                        accent="bg-green-400"
                        onClick={user.role === 'tenant_admin' ? () => navigate('/reports') : undefined}
                    />
                    <StatCard
                        label="New Orders"
                        value={stats.todayOrdersCount}
                        sub={`${stats.todaySales} EGP in sales`}
                        icon="🛒"
                        gradient="from-blue-500/10 to-gray-900"
                        accent="bg-blue-400"
                        onClick={() => navigate('/orders')}
                    />
                    <StatCard
                        label="Unpaid Orders"
                        value={stats.unpaidOrders}
                        sub={stats.unpaidOrders > 0 ? 'needs follow-up' : 'all settled ✓'}
                        icon={stats.unpaidOrders > 0 ? '⏳' : '✨'}
                        gradient={stats.unpaidOrders > 0 ? 'from-red-500/10 to-gray-900' : 'from-gray-800 to-gray-900'}
                        accent="bg-red-400"
                        onClick={() => navigate('/orders')}
                    />
                    <StatCard
                        label="Total Owed"
                        value={`${stats.totalOwed} EGP`}
                        sub="across all customers"
                        icon="📋"
                        gradient="from-amber-500/10 to-gray-900"
                        accent="bg-amber-400"
                        onClick={() => navigate('/customers')}
                    />
                </div>
            </div>

            {/* SECONDARY — Business overview */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Overview</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        label="Total Customers"
                        value={stats.totalCustomers}
                        icon="👥"
                        gradient="from-purple-500/10 to-gray-900"
                        accent="bg-purple-400"
                        onClick={() => navigate('/customers')}
                    />
                    <StatCard
                        label="Total Products"
                        value={stats.totalProducts}
                        icon="📦"
                        gradient="from-indigo-500/10 to-gray-900"
                        accent="bg-indigo-400"
                        onClick={() => navigate('/products')}
                    />
                    <StatCard
                        label="Low Stock Alert"
                        value={stats.lowStock}
                        sub={stats.lowStock > 0 ? 'tap to review' : 'all stocked ✓'}
                        icon={stats.lowStock > 0 ? '⚠️' : '✅'}
                        gradient={stats.lowStock > 0 ? 'from-orange-500/10 to-gray-900' : 'from-gray-800 to-gray-900'}
                        accent="bg-orange-400"
                        onClick={() => navigate('/inventory')}
                    />
                </div>
            </div>

            {/* Quick actions */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-white rounded-full" />
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Quick Actions</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate('/orders/create')}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20"
                    >
                        + New Order
                    </button>
                    <button
                        onClick={() => navigate('/customers/create')}
                        className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-xl transition-all"
                    >
                        + Add Customer
                    </button>
                    {user.role === 'tenant_admin' && (
                        <>
                            <button
                                onClick={() => navigate('/products/create')}
                                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-xl transition-all"
                            >
                                + Add Product
                            </button>
                            <button
                                onClick={() => navigate('/reports')}
                                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-xl transition-all"
                            >
                                📊 View Reports
                            </button>
                        </>
                    )}
                    <button onClick={() => setShowQuickSale(true)}
    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg">
    ⚡ بيع سريع
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
        <div className="grid grid-cols-3 gap-4">
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
                        <p className="text-white text-sm font-semibold mb-2 text-right" dir="rtl">
                            {insights[card.key].title}
                        </p>
                        <p className="text-gray-400 text-xs leading-relaxed text-right" dir="rtl">
                            {insights[card.key].body}
                        </p>
                    </div>
                )
            ))}
        </div>
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
            <div className="grid grid-cols-2 gap-4">

                {/* Recent Orders */}
<div>
    <div className="flex items-center justify-between mb-3">
        <div>
            <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full" />
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Recent Orders</p>
            </div>
            <p className="text-gray-600 text-xs mt-0.5 ml-3">
                {recentOrders.length} orders · today and recent
            </p>
        </div>
        <button
            onClick={() => navigate('/orders')}
            className="text-blue-400 hover:text-blue-300 text-xs font-medium"
        >
            View all →
        </button>
    </div>

    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-800">
            {[
                { label: 'All', value: 'all', count: recentOrders.length },
                { label: 'Paid', value: 'paid', count: recentOrders.filter(o => o.status === 'paid').length },
                { label: 'Unpaid', value: 'unpaid', count: recentOrders.filter(o => o.status === 'unpaid').length },
            ].map(tab => (
                <button
                    key={tab.value}
                    onClick={() => setOrdersFilter(tab.value)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        ordersFilter === tab.value
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        ordersFilter === tab.value ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500'
                    }`}>
                        {tab.count}
                    </span>
                </button>
            ))}
        </div>

        {/* Table */}
        {recentOrders.length === 0 ? (
            <div className="text-center py-10">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-gray-500 text-sm mb-3">No orders yet</p>
                <button
                    onClick={() => navigate('/orders/create')}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                    Create your first order →
                </button>
            </div>
        ) : (
            <table className="w-full table-fixed">
                <colgroup>
    <col className="w-16" />
    <col className="w-32"/>    
    <col className="w-12" />   
    <col className="w-24" />    
    <col className="w-24" />   
    <col className="w-20" />   
    <col className="w-28" />   
</colgroup>
                <thead>
                    <tr className="border-b border-gray-800">
                        {['Invoice', 'Customer', 'Items', 'Total', 'Balance', 'Status', 'Time'].map(h => (
                            <th key={h} className="px-2 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                {h}
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
                                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
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
                                <td className="px-2 py-3 text-gray-400 text-sm">
                                    {order.items_count}
                                </td>
                                <td className="px-2 py-3 text-white text-sm font-semibold">
                                    {order.total} <span className="text-gray-500 text-xs font-normal">EGP</span>
                                </td>
                                <td className="px-2 py-3 text-sm font-medium">
                                    {order.amount_remaining > 0
                                        ? <span className="text-red-400 whitespace-nowrap">-{order.amount_remaining}</span>
                                        : <span className="text-gray-600">—</span>
                                    }
                                </td>
                                <td className="px-2 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                                        order.status === 'paid'
                                            ? 'bg-green-500/15 text-green-400'
                                            : 'bg-red-500/15 text-red-400'
                                    }`}>
                                        {order.status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                                    </span>
                                </td>
                                <td className="px-2 py-3 text-gray-500 text-xs whitespace-nowrap">
                                    {new Date(order.order_date ?? order.created_at).toLocaleDateString('en-GB', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </td>
                            </tr>
                        ))}
                        
                </tbody>
            </table>
        )}
    </div>
</div>

                {/* Top debtors OR Low stock */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-amber-500 rounded-full" />
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                                {topDebtors.length > 0 ? 'Top Debtors' : 'Low Stock Items'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(topDebtors.length > 0 ? '/customers' : '/inventory')}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                            View all →
                        </button>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        {topDebtors.length > 0 ? (
                            <div className="divide-y divide-gray-800">
                                {topDebtors.map((debtor, i) => (
                                    <div
                                        key={debtor.id}
                                        onClick={() => navigate(`/customers/${debtor.id}/balance`)}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                                i === 0 ? 'bg-red-500/20 text-red-400' :
                                                i === 1 ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                #{i + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{debtor.name}</p>
                                                <p className="text-gray-500 text-xs">{debtor.orders} unpaid order{debtor.orders !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <p className="text-red-400 text-sm font-bold shrink-0">{Math.round(debtor.total)} EGP</p>
                                    </div>
                                ))}
                            </div>
                        ) : lowStockItems.length > 0 ? (
                            <div className="divide-y divide-gray-800">
                                {lowStockItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => navigate('/inventory')}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors cursor-pointer"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{item.product_name}</p>
                                            <p className="text-gray-500 text-xs">{item.warehouse_name}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-orange-400 text-sm font-bold">{item.quantity} left</p>
                                            <p className="text-gray-500 text-xs">threshold: {item.threshold}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-4xl mb-2">🎉</p>
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
        onClose={() => {
            setShowQuickSale(false),
            fetchData()
        }}
        products={products}
        warehouses={warehouses}
         inventory={inventory} 
        storeId={user.store_id}
    />
)}

        </div>
    )
}