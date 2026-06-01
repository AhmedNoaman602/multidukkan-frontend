import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import Modal from '../components/Modal'
import {useToast} from '../hooks/useToast'
import DeleteModal from '../components/DeleteModal'

export default function Products() {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [deleteTarget , setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [page , setPage] = useState(1)
    const [lastPage , setLastPage] = useState(1)
    const {showToast} = useToast()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchData = async () => {
        try {
            const res = await api.get('/products' ,{params: {page , search}})
            setProducts(res.data.data)
            setLastPage(res.data.meta.last_page)
        } catch (err) {
            setError('Failed to load products')
        } finally {
            setLoading(false)
        }
    }
    
    const handleSearch = (value) => {
        setSearch(value)
        setPage(1)
    }
    useEffect(() => { fetchData() }, [page , search])

    const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
        await api.delete(`/products/${deleteTarget.id}`)
        setDeleteTarget(null)
        fetchData()
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete product' , 'error')
        setDeleteTarget(null)
    } finally {
        setDeleting(false)
    }
}

    if (loading) return <LoadingSpinner />

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Products</h2>
                <div className="flex items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by name or SKU..."
                    />
                    {user.role === 'tenant_admin' && (
                        <button
                            onClick={() => navigate('/products/create')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            + Add Product
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Name', 'SKU', 'Default', 'سعر أ', 'سعر ب', 'سعر ج', 'سعر د', 'سعر هـ', 'Unit', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 text-white text-sm">{product.name}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{product.sku}</td>
                                <td className="px-4 py-3 text-white text-sm">{product.price} EGP</td>
                                {['a', 'b', 'c', 'd', 'e'].map(tier => (
                                    <td key={tier} className="px-4 py-3 text-gray-300 text-sm">
                                        {product[`price_${tier}`] ?? '—'}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-gray-400 text-sm">{product.unit}</td>
                                <td className="px-4 py-3">
    <div className="flex gap-2">
        {user.role !== 'store_staff' && (
            <button
                onClick={() => navigate(`/products/${product.id}/edit`)}
                className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
            >
                Edit
            </button>
        )}
        {user.role === 'tenant_admin' && (
            <button
                onClick={() => setDeleteTarget(product)}
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

                {products.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search ? `No products matching "${search}"` : 'No products yet. Add your first product.'}
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
                title="Delete Product"
                name={deleteTarget?.name}
            />
        </div>
    )
}