import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Products() {
    const navigate = useNavigate()
    const [warehouses, setWarehouses] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [stockUnit, setStockUnit] = useState('base')
    const [form, setForm] = useState({
        name: '', sku: '', price: '', unit: 'pcs',
        price_a: '', price_b: '', price_c: '', price_d: '', price_e: '',
        secondary_unit: '', conversion_factor: '',
        warehouse_id: '', quantity: 0, threshold: 10
    })
    const [saving, setSaving] = useState(false)
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchData = async () => {
        try {
            const [productsRes, warehousesRes] = await Promise.all([
                api.get('/products'),
                api.get('/warehouses')
            ])
            setProducts(productsRes.data.data)
            setWarehouses(warehousesRes.data.data)
        } catch (err) {
            setError('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const actualQuantity = stockUnit === 'secondary' && form.conversion_factor
                ? parseInt(form.quantity) * parseInt(form.conversion_factor)
                : parseInt(form.quantity)

            await api.post('/products', {
                ...form,
                price: parseFloat(form.price),
                quantity: actualQuantity
            })
            setForm({
                name: '', sku: '', price: '', unit: 'pcs',
                price_a: '', price_b: '', price_c: '', price_d: '', price_e: '',
                secondary_unit: '', conversion_factor: '',
                warehouse_id: '', quantity: 0, threshold: 10
            })
            setShowForm(false)
            setStockUnit('base')
            fetchData()
        } catch (err) {
            setError('Failed to create product')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Products</h2>
                {user.role === 'tenant_admin' && (
                    <button
                        onClick={() => navigate('/products/create')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        + Add Product
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}



            {/* Table */}
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
                                    {user.role !== 'store_staff' && (
                                        <button
                                            onClick={() => navigate(`/products/${product.id}/edit`)}
                                            className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        No products yet. Add your first product.
                    </div>
                )}
            </div>
        </div>
    )
}