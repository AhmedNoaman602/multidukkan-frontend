import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import Modal from '../components/Modal'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [yearFilter, setYearFilter] = useState('')
    const [expandedOrderId, setExpandedOrderId] = useState(null)
    const [payTarget, setPayTarget] = useState(null)
    const [payForm, setPayForm] = useState({ amount: '', method: 'cash' })
    const [paying, setPaying] = useState(false)
    const [payError, setPayError] = useState('')
    const [paySuccess, setPaySuccess] = useState('')

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
            (order.invoice_number || '').toLowerCase().includes(search.toLowerCase());

        const matchesYear = yearFilter
            ? new Date(order.created_at).getFullYear() === parseInt(yearFilter)
            : true

        return matchesSearch && matchesYear
    })

    const toggleOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
}

const handlePay = async (e) => {
    e.preventDefault()
    setPaying(true)
    setPayError('')
    try {
        await api.post('/payments', {
            order_id:    payTarget.id,
            customer_id: payTarget.customer_id,
            amount:      parseFloat(payForm.amount),
            method:      payForm.method,
        })
        setPaySuccess('Payment processed successfully!')
        setTimeout(() => {
            setPayTarget(null)
            setPaySuccess('')
            setPayForm({ amount: '', method: 'cash' })
            api.get('/orders').then(res => setOrders(res.data.data))
        }, 1500)
    } catch (err) {
        setPayError(err.response?.data?.message || 'Failed to process payment')
    } finally {
        setPaying(false)
    }
}

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
                        placeholder="Search by customer or invoice number..."
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
                            {['Invoice', 'Customer', 'Items', 'Total', 'Status', 'Date',''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
    {filtered.map(order => (
        <>
            <tr
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
            >
                <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                    {order.invoice_number || `#${order.id}`}
                </td>
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
                <td className="px-4 py-3  text-gray-400 text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                </td>
           <td className="px-4 py-3 whitespace-nowrap">
    <div className="flex items-center gap-2">
        <button
            onClick={(e) => {
                e.stopPropagation()
                window.open(`/orders/${order.id}/invoice`, '_blank')
            }}
            className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors"
        >
            Invoice
        </button>
        {order.status === 'unpaid' && (
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setPayTarget(order)
                    setPayForm({ amount: order.amount_remaining, method: 'cash' })
                }}
                className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium rounded-lg hover:bg-purple-500/20 transition-colors"
            >
                Pay
            </button>
        )}
    </div>
</td>
                
            </tr>
        </>
    ))}
</tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search || yearFilter ? 'No orders match your filters.' : 'No orders yet.'}
                    </div>
                )}
            </div>
            <Modal
    open={!!payTarget}
    onClose={() => {
        setPayTarget(null)
        setPayError('')
        setPaySuccess('')
        setPayForm({ amount: '', method: 'cash' })
    }}
    title={`Pay — ${payTarget?.invoice_number}`}
    error={payError}
    success={paySuccess}
>
    {payTarget && (
        <form onSubmit={handlePay} className="space-y-4">
            <div>
                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                />
            </div>
            <div>
                <label className="block text-sm text-gray-400 mb-1">Method</label>
                <select
                    value={payForm.method}
                    onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={() => setPayTarget(null)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={paying || !payForm.amount}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {paying ? 'Processing...' : 'Confirm Payment'}
                </button>
            </div>
        </form>
    )}
</Modal>
        </div>
    )
}