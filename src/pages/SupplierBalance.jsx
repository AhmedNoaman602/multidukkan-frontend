import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function SupplierBalance() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [mode, setMode] = useState(null) 
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [autoForm, setAutoForm] = useState({ amount: '', method: 'cash',purchase_order_id: ''  })

    const fetchData = async () => {
        try {
            const [balanceRes, historyRes, ordersRes] = await Promise.all([
                api.get(`/suppliers/${id}/balance`),
                api.get(`/suppliers/${id}/ledger`),
                api.get('/purchase-orders')
            ])
            setData({
                balance: balanceRes.data,
                history: historyRes.data.history
            })
            setPurchaseOrders(
                ordersRes.data.data.filter(o =>
                    o.supplier_id === parseInt(id) && o.status === 'unpaid'
                )
            )
        } catch (err) {
            setError('Failed to load supplier data')
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
            await api.post('/supplier-payments', {
                supplier_id: parseInt(id),
                amount: parseFloat(autoForm.amount),
                method: autoForm.method,
                ...(autoForm.purchase_order_id && { 
                    purchase_order_id: parseInt(autoForm.purchase_order_id) 
                }),
            })
            setSuccess('Payment added successfully!')
            setMode(null)
            setAutoForm({amount: '', method: 'cash' ,purchase_order_id: ''  })
            setTimeout(() => setSuccess(''), 3000)
            fetchData()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add payment')
        } finally {
            setSaving(false)
        }
    }
    if (loading) return <LoadingSpinner />
    if (error && !data) return <p className="text-red-400">{error}</p>

    const { balance, history } = data
    const isOwed = balance.balance > 0
    const isOverpaid = balance.balance < 0

    const typeStyles = {
    PURCHASE_CHARGE:   'bg-red-500/20 text-red-400',
    PURCHASE_REVERSAL: 'bg-yellow-500/20 text-yellow-400',
    SUPPLIER_PAYMENT:  'bg-green-500/20 text-green-400',
}

    return (
        <div className="max-w-4xl">
            <button
                onClick={() => navigate('/suppliers')}
                className="text-gray-400 hover:text-white transition-colors text-sm mb-6 block"
            >
                ← Back to Suppliers
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">{balance.supplier_name}</h2>

            {/* Balance card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                        <p className={`text-4xl font-bold ${isOwed ? 'text-red-400' : isOverpaid ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {balance.balance} EGP
                        </p>
                        <p className={`text-sm mt-1 ${isOwed ? 'text-red-400' : isOverpaid ? 'text-yellow-400' : 'text-green-400'}`}>
                            {isOwed ? 'You owe this supplier' : isOverpaid ? 'Overpaid' : 'Fully settled'}
                        </p>
                    </div>

                    {/* Two action buttons */}
                    <div className="flex gap-2">
                       <button
                            onClick={() => setMode(mode === 'auto' ? null : 'auto')}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {mode === 'auto' ? 'Cancel' : '💰 Pay Supplier'}
                        </button>
                    </div>
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

         {mode === 'auto' && (
    <div className="bg-gray-900 border border-purple-500/20 rounded-xl p-6 mb-6">
        <h3 className="text-white font-semibold mb-1">💰 Pay Supplier</h3>
        <p className="text-gray-500 text-xs mb-4">
            Pays unpaid orders oldest first.
        </p>

        {/* Order preview — only when orders exist */}
        {purchaseOrders.length === 0 ? (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-sm">No unpaid orders.</p>
            </div>
        ) : (
            <div className="mb-4 space-y-1">
                {purchaseOrders.map((o, i) => (
                    <div key={o.id} className="flex justify-between text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
                        <span>#{i + 1} — Order #{o.id}</span>
                        <span>{o.amount_remaining ?? o.total} EGP</span>
                    </div>
                ))}
            </div>
        )}

        {/* Form always shows regardless of orders */}
        <form onSubmit={handlePayment} className="grid grid-cols-2 gap-4">
            {purchaseOrders.length > 0 && (
    <div className="col-span-2">
        <label className="block text-sm text-gray-400 mb-1">
            Pay Specific Order <span className="text-gray-600">(optional — leave blank for FIFO)</span>
        </label>
        <select
            value={autoForm.purchase_order_id || ''}
            onChange={(e) => setAutoForm({ ...autoForm, purchase_order_id: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
        >
            <option value="">Pay oldest first (auto)</option>
            {purchaseOrders.map(o => (
                <option key={o.id} value={o.id}>
                    {o.invoice_number} — {o.amount_remaining ?? o.total} EGP
                </option>
            ))}
        </select>
    </div>
)}
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
            <div className="col-span-2">
                <button
                    type="submit"
                    disabled={saving || !autoForm.amount}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {saving ? 'Processing...' : 'Pay Supplier'}
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