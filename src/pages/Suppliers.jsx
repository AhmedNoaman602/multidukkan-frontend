import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'
import StatBoxes from '../components/StatBoxes'
import {useToast} from '../hooks/useToast'
import DeleteModal from '../components/DeleteModal'

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [stats, setStats] = useState([])
    const {showToast} = useToast()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchSuppliers = () => {
        api.get('/suppliers', { params: { page, search } })
            .then(res => {
                setSuppliers(res.data.data)
                setLastPage(res.data.meta.last_page)
                setStats(res.data.stats)
            })
            .catch(() => showToast('Failed to load suppliers', 'error'))
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
            showToast('Supplier deleted successfully.', 'success')
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete supplier', 'error')
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">Suppliers</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

            {
                stats && (
                    <StatBoxes stats={[
                        { label: 'Total Suppliers', value: stats.total_suppliers,      color: 'white' },
                        { label: 'Total Owed',      value: `${stats.total_owed} EGP`,  color: 'red'   },
                    ]} />
                )
            }

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Code', 'Name', 'Phone', 'Address', 'Area', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
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
                                                     console.log('delete clicked', supplier.id)
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
                        → السابق
                    </button>
                    <span className="text-gray-400 text-sm">Page {page} of {lastPage}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page === lastPage}
                        className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        التالي ←
                    </button>
                </div>
            )}
          <DeleteModal
    open={!!deleteTarget}
    onClose={() => setDeleteTarget(null)}
    onConfirm={handleDelete}
    deleting={deleting}
    title="Delete Supplier"
    name={deleteTarget?.name}
/>
        </div>
    )
}