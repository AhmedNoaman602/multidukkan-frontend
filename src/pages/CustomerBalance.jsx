import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CustomerBalance() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showPayment, setShowPayment] = useState(false)
    const [orders, setOrders] = useState([])
    const [paymentForm, setPaymentForm] = useState({ order_id: '', amount: '', method: 'cash' })
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')

    const fetchData = async () => {
        try {
            const [balanceRes, historyRes, ordersRes] = await Promise.all([
                api.get(`/customers/${id}/balance`),
                api.get(`/customers/${id}/ledger`),
                api.get('/orders')
            ])
            setData({
                balance: balanceRes.data,
                history: historyRes.data.history
            })
            setOrders(ordersRes.data.data.filter(o => o.customer_id === parseInt(id)))
        } catch (err) {
            setError('Failed to load customer data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [id])

    const handlePayment = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            await api.post('/payments', {
                order_id: parseInt(paymentForm.order_id),
                customer_id: parseInt(id),
                amount: parseFloat(paymentForm.amount),
                method: paymentForm.method
            })
            setSuccess('Payment added successfully!')
            setShowPayment(false)
            setPaymentForm({ order_id: '', amount: '', method: 'cash' })
            setTimeout(() => setSuccess(''), 3000)
            fetchData()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add payment')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />

    if (error && !data) return (
        <p className="text-red-400">{error}</p>
    )

    const { balance, history } = data
    const isOwed = balance.balance > 0
    const isCredit = balance.balance < 0

    const typeStyles = {
        ORDER_CHARGE: 'bg-red-500/20 text-red-400',
        PAYMENT: 'bg-green-500/20 text-green-400',
        REVERSAL: 'bg-yellow-500/20 text-yellow-400',
        CREDIT_APPLY: 'bg-blue-500/20 text-blue-400',
    }

    return (
        <div className="max-w-4xl">
            {/* Back */}
            <button
                onClick={() => navigate('/customers')}
                className="text-gray-400 hover:text-white transition-colors text-sm mb-6 block"
            >
                ← Back to Customers
            </button>

            {/* Customer name */}
            <h2 className="text-2xl font-bold text-white mb-6">{balance.customer_name}</h2>

            {/* Balance card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                    <p className={`text-4xl font-bold ${isOwed ? 'text-red-400' : isCredit ? 'text-green-400' : 'text-gray-400'}`}>
                        {balance.balance} EGP
                    </p>
                    <p className={`text-sm mt-1 ${isOwed ? 'text-red-400' : isCredit ? 'text-green-400' : 'text-gray-400'}`}>
                        {balance.status === 'owes' ? 'Customer owes money' :
                         balance.status === 'credit' ? 'Customer has credit' :
                         'Fully settled'}
                    </p>
                </div>
                <button
                    onClick={() => setShowPayment(!showPayment)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {showPayment ? 'Cancel' : '+ Add Payment'}
                </button>
            </div>

            {/* Success */}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {success}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* Payment form */}
            {showPayment && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4">Add Payment</h3>
                    <form onSubmit={handlePayment} className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Order</label>
                            <select
                                value={paymentForm.order_id}
                                onChange={(e) => setPaymentForm({ ...paymentForm, order_id: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            >
                                <option value="">Select order</option>
                                {orders.map(o => (
                                    <option key={o.id} value={o.id}>Order #{o.id}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Amount</label>
                            <input
                                type="number"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Method</label>
                            <select
                                value={paymentForm.method}
                                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="check">Check</option>
                            </select>
                        </div>
                        <div className="col-span-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {saving ? 'Saving...' : 'Add Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Transaction history */}
            <h3 className="text-white font-semibold mb-4">Transaction History</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Type', 'Amount', 'Description', 'Date'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {history && history.map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeStyles[entry.type] || 'bg-gray-700 text-gray-300'}`}>
                                        {entry.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white text-sm">{entry.amount} EGP</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{entry.description || '—'}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {new Date(entry.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {(!history || history.length === 0) && (
                    <div className="text-center py-16 text-gray-500">
                        No transactions yet.
                    </div>
                )}
            </div>
        </div>
    )
}