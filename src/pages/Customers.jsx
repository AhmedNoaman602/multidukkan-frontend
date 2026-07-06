import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import StatBoxes from '../components/StatBoxes'
import {useToast} from '../hooks/useToast'
import DeleteModal from '../components/DeleteModal'

export default function Customers() {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [stats, setStats] = useState(null)
    const navigate = useNavigate()
    const {showToast} = useToast()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchCustomers = () => {
        api.get('/customers', { params: { page, search } })
            .then(res => {
                setCustomers(res.data.data)
                setLastPage(res.data.meta.last_page)
                setStats(res.data.stats)
            })
            .catch(() => {
                showToast('Failed to load customers', 'error')
                setCustomers([])
                setStats(null)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchCustomers() }, [page, search])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/customers/${deleteTarget.id}`)
            showToast('Customer deleted successfully', 'success')
            setDeleteTarget(null)
            fetchCustomers()
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete customer' , 'error')
            setDeleteTarget(null)
        } finally {
            setDeleting(false)
        }
    }

    const handleSearch = (value) => {
        setSearch(value)
        setPage(1)
    }

    if (loading) return <LoadingSpinner />

    return (
        <div>
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <h2 className="text-xl sm:text-2xl font-bold text-white">Customers</h2>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, customer code, or phone..."
        />
        {user.role !== 'store_staff' && (
            <button
                onClick={() => navigate('/customers/create')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
                + Add Customer
            </button>
        )}
    </div>
</div>

            {
                stats && (
                    <StatBoxes stats={[
                        { label: 'Total Customers',   value: stats.total_customers, color: 'white' },
                        { label: 'Total Outstanding', value: `${stats.total_outstanding} EGP`, color: 'red'},
                    ]} />
                )
            }

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Code', 'Name', 'Phone', 'Address', 'Area', 'Price Tier', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {customers.map(customer => (
                            <tr
                                key={customer.id}
                                onClick={() => navigate(`/customers/${customer.id}/balance`)}
                                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                            >
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {customer.code}
                                </td>
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {customer.name}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {customer.phone}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {customer.address || '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {customer.area || '—'}
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
                                        {user.role !== 'store_staff' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/customers/${customer.id}/edit`)
                                                }}
                                                className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {user.role === 'tenant_admin' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDeleteTarget(customer)
                                                }}
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

                {customers.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search ? `No customers matching "${search}"` : 'No customers yet. Add your first customer.'}
                    </div>
                )}
            </div>

            {lastPage > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => setPage(p => p - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        ← Previous
                    </button>
                    <span className="text-gray-400 text-sm">Page {page} of {lastPage}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page === lastPage}
                        className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}

           <DeleteModal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            deleting={deleting}
            title="Delete Customer"
            name={deleteTarget?.name}
            warning="All balance history and transactions linked to this customer will be affected."
           />
        </div>
    )
}