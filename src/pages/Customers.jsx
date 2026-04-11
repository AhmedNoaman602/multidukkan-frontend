import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Customers() {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/customers')
            .then(res => setCustomers(res.data.data))
            .catch(() => setError('Failed to load customers'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Customers</h2>
                <button
                    onClick={() => navigate('/customers/create')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    + Add Customer
                </button>
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
                            {['Name', 'Phone', 'Address', 'Price Tier', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {customers.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 text-white text-sm font-medium">{customer.name}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{customer.phone}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{customer.address || '—'}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        customer.price_tier === 'default'
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {customer.price_tier === 'default' ? 'Default' : `سعر ${customer.price_tier.toUpperCase()}`}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => navigate(`/customers/${customer.id}/balance`)}
                                        className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs font-medium rounded-lg transition-colors"
                                    >
                                        View Balance
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {customers.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        No customers yet. Add your first customer.
                    </div>
                )}
            </div>
        </div>
    )
}