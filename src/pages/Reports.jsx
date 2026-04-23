import { useState } from 'react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Reports() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [payments, setPayments] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searched, setSearched] = useState(false)

    const fetchPayments = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await api.get(`/payments?date=${date}`)
            setPayments(res.data.data)
            setTotal(res.data.total)
            setSearched(true)
        } catch (err) {
            setError('Failed to load payments')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        fetchPayments()
    }

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatMethod = (method) => {
        const methods = {
            cash: 'نقدي',
            card: 'بطاقة',
            transfer: 'تحويل',
        }
        return methods[method] || method
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Daily Payments Report</h2>
            </div>

            {/* Date picker form */}
            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-1">Select Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        {loading ? 'Loading...' : 'View Report'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* Total card */}
            {searched && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Total Collected</p>
                        <p className="text-3xl font-bold text-green-400">{total} EGP</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Number of Payments</p>
                        <p className="text-3xl font-bold text-white">{payments.length}</p>
                    </div>
                </div>
            )}

            {/* Payments table */}
            {searched && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                {['Customer', 'Amount', 'Method', 'Time'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {payments.map(payment => (
                                <tr key={payment.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-white text-sm font-medium">
                                        {payment.customer?.name || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-green-400 text-sm font-semibold">
                                        {payment.amount} EGP
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg">
                                            {formatMethod(payment.method)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {formatTime(payment.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {payments.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            No payments found for this date.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}