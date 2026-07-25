import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/products/${id}`)
            .then(res => setProduct(res.data.data))
            .finally(() => setLoading(false))
    }, [id])

    useEffect(() => {
        api.get(`/products/${id}/suppliers`)
            .then(res => setSuppliers(res.data.data))
            .catch(err => console.error(err))
    }, [id])

    if (loading) return <LoadingSpinner />
    if (!product) return <div className="text-red-400">Product not found</div>

    const totalStock = product.stocks?.reduce((sum, s) => sum + s.quantity, 0) ?? 0

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <BackButton label="Back to Products" to="/products" />
                <button
                    onClick={() => navigate(`/products/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Edit Product
                </button>
            </div>

            {/* Basic Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                        <p className="text-gray-400 text-sm mt-1">SKU: {product.sku}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        totalStock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                        {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Default Price</p>
                        <p className="text-white text-lg font-semibold">{product.price} EGP</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Cost Price</p>
                        <p className="text-white text-lg font-semibold">
                            {product.cost_price ? `${product.cost_price} EGP` : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Profit Margin</p>
                        <p className="text-blue-400 text-lg font-semibold">
                            {product.profit_margin ? `${product.profit_margin}%` : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Unit</p>
                        <p className="text-white text-sm">{product.unit}</p>
                    </div>
                    {product.secondary_unit && (
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Secondary Unit</p>
                            <p className="text-white text-sm">
                                1 {product.secondary_unit} = {product.conversion_factor} {product.unit}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Price Tiers */}
            {['a', 'b', 'c', 'd', 'e'].some(t => product[`price_${t}`]) && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Price Tiers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {['a', 'b', 'c', 'd', 'e'].map(tier => (
                            <div key={tier}>
                                <p className="text-gray-500 text-xs mb-1">Price {tier.toUpperCase()}</p>
                                <p className="text-white text-sm font-medium">
                                    {product[`price_${tier}`] ? `${product[`price_${tier}`]} EGP` : '—'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warehouse Stock */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-4">
                <div className="px-4 py-3 border-b border-gray-800">
                    <h3 className="text-white font-semibold text-sm">Warehouse Stock</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Warehouse', 'Quantity', 'Threshold'].map(h => (
                                <th key={h} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {product.stocks?.map(s => (
                            <tr key={s.warehouse_id} className="hover:bg-gray-800/50">
                                <td className="px-4 py-3 text-white text-sm">{s.warehouse_name}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        s.quantity > s.threshold
                                            ? 'bg-green-500/20 text-green-400'
                                            : s.quantity > 0
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {s.quantity} {product.unit}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{s.threshold}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!product.stocks || product.stocks.length === 0) && (
                    <div className="text-center py-8 text-gray-500 text-sm">No stock data</div>
                )}
            </div>

            {/* Suppliers */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-4">
                <div className="px-4 py-3 border-b border-gray-800">
                    <h3 className="text-white font-semibold text-sm">Suppliers</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Supplier', 'Cost Price', 'Last Purchase', 'Preferred'].map(h => (
                                <th key={h} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {suppliers.map(s => (
                            <tr key={s.id} className="hover:bg-gray-800/50">
                                <td className="px-4 py-3 text-white text-sm">{s.name}</td>
                                <td className="px-4 py-3 text-white text-sm">
                                    {s.cost_price ?? s.last_purchase_price ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{s.last_purchased_at ?? '—'}</td>
                                <td className="px-4 py-3 text-sm">{s.is_preferred ? '⭐' : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {suppliers.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">No suppliers linked</div>
                )}
            </div>
        </div>
    )
}