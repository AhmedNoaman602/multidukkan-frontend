import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import Modal from '../components/Modal'

export default function CustomerBalance() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [orders, setOrders] = useState([])
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [paymentModal, setPaymentModal] = useState(false)
    const [autoForm, setAutoForm] = useState({ amount: '', method: 'cash' })

    const fetchData = async () => {
        try {
            const [balanceRes, historyRes, ordersRes] = await Promise.all([
                api.get(`/customers/${id}/balance`),
                api.get(`/customers/${id}/ledger`),
                api.get('/orders'),
            ])
            setData({
                balance: balanceRes.data,
                history: historyRes.data.history,
            })
            setOrders(ordersRes.data.data.filter(o => o.customer_id === parseInt(id)))
        } catch {
            setError('Failed to load customer data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [id])

    const handleAutoPayment = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const res = await api.post('/payments/auto', {
                customer_id: parseInt(id),
                amount: parseFloat(autoForm.amount),
                method: autoForm.method,
            })
            setSuccess(res.data.message)
            setPaymentModal(false)
            setAutoForm({ amount: '', method: 'cash' })
            setTimeout(() => setSuccess(''), 4000)
            fetchData()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process payment')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />
    if (error && !data) return <p className="text-red-400">{error}</p>

    const { balance, history } = data
    const isOwed = balance.balance > 0
    const isCredit = balance.balance < 0
    const unpaidOrders = orders.filter(o => o.status === 'unpaid')

    const typeStyles = {
        ORDER_CHARGE:    'bg-red-500/20 text-red-400',
        PAYMENT:         'bg-green-500/20 text-green-400',
        REVERSAL:        'bg-yellow-500/20 text-yellow-400',
        CREDIT_APPLY:    'bg-blue-500/20 text-blue-400',
        CREDIT:          'bg-teal-500/20 text-teal-400',
        CREDIT_CONSUMED: 'bg-purple-500/20 text-purple-400',
    }

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-4">
                <BackButton label="Back to Customers" to="/customers" />
                <h2 className="text-2xl font-bold text-white">{balance.customer_name}</h2>
            </div>

            {/* Balance card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
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
                        onClick={() => setPaymentModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        💰 Receive Payment
                    </button>
                </div>
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* Orders */}
            <h3 className="text-white font-semibold mb-4">Orders</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Invoice', 'Total', 'Paid', 'Remaining', 'Status', 'Date'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {orders.map(order => {
                            const paid = order.total - order.amount_remaining
                            return (
                                <tr
                                    key={order.id}
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                    className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                                        {order.invoice_number}
                                    </td>
                                    <td className="px-4 py-3 text-white text-sm">{order.total} EGP</td>
                                    <td className="px-4 py-3 text-green-400 text-sm">{paid} EGP</td>
                                    <td className="px-4 py-3 text-red-400 text-sm">{order.amount_remaining} EGP</td>
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
                            )
                        })}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="text-center py-16 text-gray-500">No orders yet.</div>
                )}
            </div>

            {/* Transaction History */}
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
                    <div className="text-center py-16 text-gray-500">No transactions yet.</div>
                )}
            </div>

            {/* Payment Modal */}
            <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="💰 Receive Payment">
                <div className="space-y-4">
                    {unpaidOrders.length === 0 ? (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-blue-400 text-sm">
                                No unpaid orders. Full amount will be stored as credit.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {unpaidOrders.map((o, i) => (
                                <div key={o.id} className="flex justify-between text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
                                    <span>#{i + 1} — {o.invoice_number}</span>
                                    <span>{o.amount_remaining ?? o.total} EGP</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleAutoPayment} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={autoForm.amount}
                                    onChange={(e) => setAutoForm({ ...autoForm, amount: e.target.value })}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                    placeholder="e.g. 500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Method</label>
                                <select
                                    value={autoForm.method}
                                    onChange={(e) => setAutoForm({ ...autoForm, method: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="check">Check</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setPaymentModal(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !autoForm.amount}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {saving ? 'Processing...' : 'Receive Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    )
}