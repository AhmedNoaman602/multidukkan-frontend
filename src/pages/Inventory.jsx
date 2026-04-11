import { useState, useEffect } from 'react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Inventory() {
    const [inventory, setInventory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchInventory = async () => {
        try {
            const response = await api.get('/inventory')
            setInventory(response.data.data)
        } catch (err) {
            setError('Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInventory()
    }, [])

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Inventory</h2>
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
                            {['Product', 'Warehouse', 'Quantity', 'Threshold', 'Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {inventory.map(item => (
                            <tr key={item.id} className={`transition-colors hover:bg-gray-800/50 ${item.low_stock ? 'bg-red-500/5' : ''}`}>
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {item.product_name}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {item.warehouse_name}
                                </td>
                                <td className="px-4 py-3 text-white text-sm font-semibold">
                                    {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {item.threshold}
                                </td>
                                <td className="px-4 py-3">
                                    {item.low_stock ? (
                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                                            Low Stock
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                                            In Stock
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {inventory.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        No inventory records found.
                    </div>
                )}
            </div>
        </div>
    )
}