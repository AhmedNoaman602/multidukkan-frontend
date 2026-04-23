import { useState, useEffect } from 'react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'

export default function Inventory() {
    const [inventory, setInventory] = useState([])
    const [stores, setStores] = useState([])
    const [selectedStore, setSelectedStore] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [adjustingItem, setAdjustingItem] = useState(null)
    const [adjustQty, setAdjustQty] = useState('')
    const [adjustDirection, setAdjustDirection] = useState('in')
    const [adjustLoading, setAdjustLoading] = useState(false)
    const [adjustError, setAdjustError] = useState('')

    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const canAdjust = user.role !== 'store_staff'
    const isAdmin = user.role === 'tenant_admin'

    const fetchInventory = async () => {
        try {
            const [inventoryRes, storesRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/stores'),
            ])
            setInventory(inventoryRes.data.data)
            setStores(storesRes.data.data)
        } catch (err) {
            setError('Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchInventory() }, [])

    const openAdjustModal = (item, direction) => {
        setAdjustingItem(item)
        setAdjustDirection(direction)
        setAdjustQty('')
        setAdjustError('')
    }

    const closeAdjustModal = () => {
        setAdjustingItem(null)
        setAdjustQty('')
        setAdjustError('')
    }

    const submitAdjust = async () => {
        setAdjustError('')
        const qty = parseInt(adjustQty, 10)
        if (!qty || qty < 1) {
            setAdjustError('Please enter a quantity of 1 or more.')
            return
        }
        setAdjustLoading(true)
        try {
            await api.post(`/inventory/${adjustingItem.id}/adjust`, {
                quantity: qty,
                direction: adjustDirection,
            })
            await fetchInventory()
            closeAdjustModal()
        } catch (err) {
            setAdjustError(err.response?.data?.message || 'Failed to adjust stock')
        } finally {
            setAdjustLoading(false)
        }
    }

    const previewNewQty = () => {
        const qty = parseInt(adjustQty, 10) || 0
        if (!adjustingItem) return 0
        return adjustDirection === 'in'
            ? adjustingItem.quantity + qty
            : adjustingItem.quantity - qty
    }

    // Filter inventory by selected store
    const filteredInventory = selectedStore
        ? inventory.filter(item => String(item.store_id) === String(selectedStore))
        : inventory

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Inventory</h2>

                {/* Store filter — admin only */}
                {isAdmin && stores.length > 0 && (
                    <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All Stores</option>
                        {stores.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                )}
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
                            {[
                                'Product',
                                ...(isAdmin ? ['Store'] : []),
                                'Warehouse',
                                'Quantity',
                                'Threshold',
                                'Status',
                                'Actions'
                            ].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredInventory.map(item => (
                            <tr key={item.id} className={`transition-colors hover:bg-gray-800/50 ${item.low_stock ? 'bg-red-500/5' : ''}`}>
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {item.product_name}
                                </td>

                                {/* Store column — admin only */}
                                {isAdmin && (
                                    <td className="px-4 py-3 text-blue-400 text-sm">
                                        {item.store_name || '—'}
                                    </td>
                                )}

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
                                <td className="px-4 py-3">
                                    {canAdjust ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openAdjustModal(item, 'in')}
                                                className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                                            >
                                                + Add
                                            </button>
                                            <button
                                                onClick={() => openAdjustModal(item, 'out')}
                                                disabled={item.quantity === 0}
                                                className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                − Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 text-xs">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredInventory.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {selectedStore ? 'No inventory for this store.' : 'No inventory records found.'}
                    </div>
                )}
            </div>

            <Modal
                open={!!adjustingItem}
                onClose={closeAdjustModal}
                title={adjustDirection === 'in' ? 'Add Stock' : 'Remove Stock'}
                error={adjustError}
            >
                {adjustingItem && (
                    <form onSubmit={(e) => { e.preventDefault(); submitAdjust(); }}>
                        <div className="space-y-4">
                            <div className="text-sm text-gray-400">
                                <div className="mb-1">Product: <span className="text-white font-medium">{adjustingItem.product_name}</span></div>
                                <div className="mb-1">Warehouse: <span className="text-white font-medium">{adjustingItem.warehouse_name}</span></div>
                                <div>Current stock: <span className="text-white font-semibold">{adjustingItem.quantity}</span></div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Quantity to {adjustDirection === 'in' ? 'add' : 'remove'} *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                    autoFocus
                                />
                            </div>
                            {adjustQty && (
                                <div className="text-sm text-gray-400">
                                    New stock will be: <span className="text-white font-semibold">{previewNewQty()}</span>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeAdjustModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustLoading || !adjustQty}
                                    className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                        adjustDirection === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {adjustLoading ? 'Saving...' : adjustDirection === 'in' ? 'Add Stock' : 'Remove Stock'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    )
}