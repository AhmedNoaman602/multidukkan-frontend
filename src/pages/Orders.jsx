import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [yearFilter, setYearFilter] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/orders')
            .then(res => setOrders(res.data.data))
            .catch(() => setError('Failed to load orders'))
            .finally(() => setLoading(false))
    }, [])

    // Build year options from actual orders
    const years = [...new Set(orders.map(o =>
        new Date(o.created_at).getFullYear()
    ))].sort((a, b) => b - a)

    const filtered = orders.filter(order => {
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            String(order.id).includes(search)

        const matchesYear = yearFilter
            ? new Date(order.created_at).getFullYear() === parseInt(yearFilter)
            : true

        return matchesSearch && matchesYear
    })

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Orders</h2>
                <div className="flex items-center gap-3">
                    {/* Year filter */}
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All Years</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Search */}
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by customer or #..."
                    />

                    <button
                        onClick={() => navigate('/orders/create')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        + New Order
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['#', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filtered.map(order => (
                            <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 text-gray-400 text-sm">#{order.id}</td>
                                <td className="px-4 py-3 text-white text-sm font-medium">{order.customer_name}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{order.items_count} items</td>
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

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search || yearFilter ? 'No orders match your filters.' : 'No orders yet.'}
                    </div>
                )}
            </div>
        </div>
    )
}