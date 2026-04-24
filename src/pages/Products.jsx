import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import Modal from '../components/Modal'

export default function Products() {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [deleteTarget , setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchData = async () => {
        try {
            const res = await api.get('/products')
            setProducts(res.data.data)
        } catch (err) {
            setError('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
        await api.delete(`/products/${deleteTarget.id}`)
        setProducts(products.filter(p => p.id !== deleteTarget.id))
        setDeleteTarget(null)
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product')
        setDeleteTarget(null)
    } finally {
        setDeleting(false)
    }
}

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <LoadingSpinner />

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Products</h2>
                <div className="flex items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

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
                        {filtered.map(product => (
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

                {filtered.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search ? `No products matching "${search}"` : 'No products yet. Add your first product.'}
                    </div>
                )}
            </div>
            <Modal
                            open={!!deleteTarget}
                            onClose={() => setDeleteTarget(null)}
                            title="Delete Product"
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