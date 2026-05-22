import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

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
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 5) return 'Working late'
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        if (hour < 21) return 'Good evening'
        return 'Good night'
    }

const today = new Date().toLocaleDateString('en-CA')    
const todayFormatted = new Date().toLocaleDateString('en-EG', {
        weekday: 'long', month: 'long', day: 'numeric'
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersRes, customersRes, productsRes, inventoryRes, paymentsRes] = await Promise.all([
                    api.get('/orders'),
                    api.get('/customers'),
                    api.get('/products'),
                    api.get('/inventory'),
                    api.get(`/payments?date=${today}`).catch(() => ({ data: { data: [], total: 0, count: 0 } })),
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
                    new Date(o.created_at).toISOString().split('T')[0] === today
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
                    <p className="text-gray-500 text-sm mb-1">{todayFormatted}</p>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {getGreeting()}, {user.name}
                    </h1>
                </div>
                <div className="text-right">
                    <p className="text-white font-semibold">{user.business_name}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full capitalize">
                        {user.role?.replace(/_/g, ' ')}
                    </span>
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
                </div>
            </div>

            {/* Two-column info panels */}
            <div className="grid grid-cols-2 gap-4">

                {/* Recent orders */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500 rounded-full" />
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Recent Orders</p>
                        </div>
                        <button
                            onClick={() => navigate('/orders')}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                        >
                            View all →
                        </button>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
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
                            <div className="divide-y divide-gray-800">
                                {recentOrders.map(order => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-gray-600 text-xs font-mono">#{order.id}</span>
                                            <div className="min-w-0">
                                                <p className="text-white text-sm font-medium truncate">{order.customer_name}</p>
                                                <p className="text-gray-500 text-xs">
                                                    {new Date(order.created_at).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-white text-sm font-semibold">{order.total} EGP</span>
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                                                order.status === 'paid'
                                                    ? 'bg-green-500/15 text-green-400'
                                                    : 'bg-red-500/15 text-red-400'
                                            }`}>
                                                {order.status === 'paid' ? '✓' : '⏳'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
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

        </div>
    )
}