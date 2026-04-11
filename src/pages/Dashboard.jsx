import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [recentOrders, setRecentOrders] = useState([])
    const [topDebtors, setTopDebtors] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersRes, customersRes, productsRes] = await Promise.all([
                    api.get('/orders'),
                    api.get('/customers'),
                    api.get('/products'),
                ])

                const orders = ordersRes.data.data
                const customers = customersRes.data.data
                const products = productsRes.data.data

                // Calculate stats
                const unpaidOrders = orders.filter(o => o.status === 'unpaid')
                const totalOwed = unpaidOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)

                setStats({
                    totalCustomers: customers.length,
                    totalProducts: products.length,
                    unpaidOrders: unpaidOrders.length,
                    totalOwed: totalOwed,
                })

                // Recent orders — last 5
                setRecentOrders(orders.slice(0, 5))

            } catch (err) {
                console.error('Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <LoadingSpinner />

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">
                    Good morning, {user.name} 👋
                </h2>
                <p className="text-gray-400 mt-1 text-sm">{user.business_name}</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Customers', value: stats?.totalCustomers, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Total Products', value: stats?.totalProducts, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                    { label: 'Unpaid Orders', value: stats?.unpaidOrders, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                    { label: 'Total Owed', value: `${stats?.totalOwed} EGP`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                ].map(card => (
                    <div key={card.label} className={`${card.bg} border rounded-xl p-5`}>
                        <p className="text-gray-400 text-sm mb-2">{card.label}</p>
                        <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="mb-8">
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="flex gap-3">
                    <button
    onClick={() => navigate('/orders/create')}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
>
    + New Order
</button>
<button
    onClick={() => navigate('/customers/create')}
    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
>
    + Add Customer
</button>
{user.role === 'tenant_admin' && (
    <button
        onClick={() => navigate('/products/create')}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
    >
        + Add Product
    </button>
                    )}
                </div>
            </div>

            {/* Recent orders */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Recent Orders</h3>
                    <button
                        onClick={() => navigate('/orders')}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                        View all →
                    </button>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                {['#', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {recentOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 text-sm">#{order.id}</td>
                                    <td className="px-4 py-3 text-white text-sm font-medium">{order.customer_name}</td>
                                    <td className="px-4 py-3 text-white text-sm">{order.total} EGP</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            order.status === 'paid'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {recentOrders.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            No orders yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}