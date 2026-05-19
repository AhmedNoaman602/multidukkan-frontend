import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'
import StatBoxes from '../components/StatBoxes'

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [stats, setStats] = useState([])
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchSuppliers = () => {
        api.get('/suppliers', { params: { page, search } })
            .then(res => {
                setSuppliers(res.data.data)
                setLastPage(res.data.meta.last_page)
                setStats(res.data.stats)
            })
            .catch(() => setError('Failed to load suppliers'))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchSuppliers() }, [page, search])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/suppliers/${deleteTarget.id}`)
            setDeleteTarget(null)
            fetchSuppliers()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete supplier')
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
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Suppliers</h2>
                <div className="flex items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search by name, supplier code, or phone..."
                    />
                    {user.role !== 'store_staff' && (
                        <button
                            onClick={() => navigate('/suppliers/create')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            + Add Supplier
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            {
                stats && (
                    <StatBoxes stats={[
                        { label: 'Total Suppliers', value: stats.total_suppliers,      color: 'white' },
                        { label: 'Total Owed',      value: `${stats.total_owed} EGP`,  color: 'red'   },
                    ]} />
                )
            }

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Code', 'Name', 'Phone', 'Address', 'Area', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {suppliers.map(supplier => (
                            <tr
                                key={supplier.id}
                                onClick={() => navigate(`/suppliers/${supplier.id}/balance`)}
                                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                            >
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {supplier.code}
                                </td>
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {supplier.name}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {supplier.phone}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {supplier.address || '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {supplier.area || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        {user.role !== 'store_staff' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/suppliers/${supplier.id}/edit`)
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
                                                    setDeleteTarget(supplier)
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

                {suppliers.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search ? `No suppliers matching "${search}"` : 'No suppliers yet. Add your first supplier.'}
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

            <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Supplier">
                {deleteTarget && (
                    <form onSubmit={(e) => { e.preventDefault(); handleDelete() }}>
                        <div className="space-y-4">
                            <p className="text-gray-300 text-sm">
                                Are you sure you want to delete{' '}
                                <span className="text-white font-semibold">{deleteTarget.name}</span>?
                                This action cannot be undone.
                            </p>
                            <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
                                <p className="text-red-400 text-xs">
                                    All balance history and transactions linked to this supplier will be affected.
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