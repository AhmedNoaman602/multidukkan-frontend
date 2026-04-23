import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'

export default function Customers() {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchCustomers = () => {
        api.get('/customers')
            .then(res => setCustomers(res.data.data))
            .catch(() => setError('Failed to load customers'))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchCustomers() }, [])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/customers/${deleteTarget.id}`)
            setCustomers(customers.filter(c => c.id !== deleteTarget.id))
            setDeleteTarget(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete customer')
            setDeleteTarget(null)
        } finally {
            setDeleting(false)
        }
    }

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    )

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Customers</h2>
                <div className="flex items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or phone..."
                    />
                    {user.role !== 'store_staff' && (
                        <button
                            onClick={() => navigate('/customers/create')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            + Add Customer
                        </button>
                    )}
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
                            {['Name', 'Phone', 'Address', 'Price Tier', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filtered.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {customer.name}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {customer.phone}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {customer.address || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        !customer.price_tier || customer.price_tier === 'default'
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {!customer.price_tier || customer.price_tier === 'default'
                                            ? 'Default'
                                            : `سعر ${customer.price_tier.toUpperCase()}`}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/customers/${customer.id}/balance`)}
                                            className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-500/20 transition-colors"
                                        >
                                            Balance
                                        </button>
                                        {user.role !== 'store_staff' && (
                                            <button
                                                onClick={() => navigate(`/customers/${customer.id}/edit`)}
                                                className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {user.role === 'tenant_admin' && (
                                            <button
                                                onClick={() => setDeleteTarget(customer)}
                                                className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search ? `No customers matching "${search}"` : 'No customers yet. Add your first customer.'}
                    </div>
                )}
            </div>

            <Modal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Customer"
            >
                {deleteTarget && (
                    <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }}>
                        <div className="space-y-4">
                            <p className="text-gray-300 text-sm">
                                Are you sure you want to delete{' '}
                                <span className="text-white font-semibold">
                                    {deleteTarget.name}
                                </span>
                                ? This action cannot be undone.
                            </p>
                            <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
                                <p className="text-red-400 text-xs">
                                    All balance history and transactions linked to this customer will be affected.
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleting}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    )
}