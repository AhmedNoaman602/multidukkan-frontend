import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import ProductSearchInput from '../components/ProductSearchInput'
import Modal from '../components/Modal'
import { useToast } from '../hooks/useToast'

export default function SupplierBalance() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [allProducts, setAllProducts] = useState([])
const [attachModal, setAttachModal] = useState(false)
const [editModal, setEditModal] = useState(false)
const [selectedProduct, setSelectedProduct] = useState(null)
const [cart, setCart] = useState([])
const [pivotForm, setPivotForm] = useState({ cost_price: '', is_preferred: false, notes: '' })
const [detaching, setDetaching] = useState(null)
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [attachedProducts, setAttachedProducts] = useState([])
    const [saving, setSaving] = useState(false)
    const [paymentModal, setPaymentModal] = useState(false)
    const [payForm, setPayForm] = useState({ amount: '', method: 'cash', purchase_order_id: '' })

    const fetchData = async () => {
         try {
            const [res , productRes] = await Promise.all([
                api.get(`/suppliers/${id}/summary`),
                api.get('/products')
            ])
            const d = res.data
            setAllProducts(productRes.data.data || [])
            setData({
    balance: {
        balance: d.balance,
        supplier_name: d.supplier_name,
    },
    history: d.history,
})
            setPurchaseOrders(d.purchase_orders)
            setAttachedProducts(d.products)
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load supplier data', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [id])

    const handlePayment = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post('/supplier-payments', {
                supplier_id: parseInt(id),
                amount: parseFloat(payForm.amount),
                method: payForm.method,
                ...(payForm.purchase_order_id && {
                    purchase_order_id: parseInt(payForm.purchase_order_id)
                }),
            })
            showToast('تم إضافة الدفعة بنجاح', 'success')
            setPaymentModal(false)
            setPayForm({ amount: '', method: 'cash', purchase_order_id: '' })
            fetchData()
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add payment', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleAttach = async () => {
    if (!selectedProduct) return
    setSaving(true)
    try {
        await api.post(`/suppliers/${id}/products/${selectedProduct.id}`, pivotForm)
        showToast('Product linked to supplier', 'success')
        setAttachModal(false)
        setSelectedProduct(null)
        fetchData()
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to attach product', 'error')
    } finally {
        setSaving(false)
    }
}

const handleEdit = async () => {
    if (!selectedProduct) return
    setSaving(true)
    try {
        await api.put(`/suppliers/${id}/products/${selectedProduct.id}`, pivotForm)
        showToast('Product updated', 'success')
        setEditModal(false)
        fetchData()
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to update product', 'error')
    } finally {
        setSaving(false)
    }
}

const handleDetach = async (productId) => {
    if (!confirm('Remove this product from supplier?')) return
    setDetaching(productId)
    try {
        await api.delete(`/suppliers/${id}/products/${productId}`)
        showToast('Product removed', 'success')
        fetchData()
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to remove product', 'error')
    } finally {
        setDetaching(null)
    }
}
const addToCart = (product) => {
    if (cart.find(p => p.id === product.id)) {
        showToast('Product already in selection', 'error')
        return
    }
     if (attachedProducts.find(p => p.id === product.id)) {
        showToast('Product already linked to this supplier', 'error')
        return
    }
    setCart(c => [...c, {
        id: product.id,
        name: product.name,
        cost_price: product.cost_price ?? product.price ?? '',
        is_preferred: false,
        notes: ''
    }])
}

const removeFromCart = (productId) => {
    setCart(c => c.filter(p => p.id !== productId))
}

const updateCartItem = (productId, field, value) => {
    setCart(c => c.map(p => p.id === productId ? { ...p, [field]: value } : p))
}

const handleBulkAttach = async () => {
    if (cart.length === 0) return
    setSaving(true)
    try {
        await api.post(`/suppliers/${id}/products/bulk`, {
            products: cart.map(p => ({
                product_id: p.id,
                cost_price: p.cost_price,
                is_preferred: p.is_preferred,
                notes: p.notes
            }))
        })
        showToast(`${cart.length} product(s) linked to supplier`, 'success')
        setAttachModal(false)
        setCart([])
        fetchData()
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to attach products', 'error')
    } finally {
        setSaving(false)
    }
}

    if (loading) return <LoadingSpinner />
    const { balance, history } = data
    const isOwed = balance.balance > 0
    const isOverpaid = balance.balance < 0

    const typeStyles = {
        PURCHASE_CHARGE: 'bg-red-500/20 text-red-400',
        PURCHASE_REVERSAL: 'bg-yellow-500/20 text-yellow-400',
        SUPPLIER_PAYMENT: 'bg-green-500/20 text-green-400',
    }

    const unpaidOrders = purchaseOrders.
    filter(o => o.status === 'unpaid')
    .sort((a, b) => a.id - b.id)

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-4">
                <BackButton label="Back to Suppliers" to="/suppliers" />
                <h2 className="text-2xl font-bold text-white">{balance.supplier_name}</h2>
            </div>

            {/* Balance card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                        <p className={`text-4xl font-bold ${isOwed ? 'text-red-400' : isOverpaid ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {parseFloat(balance.balance).toFixed(2)} EGP
                        </p>
                        <p className={`text-sm mt-1 ${isOwed ? 'text-red-400' : isOverpaid ? 'text-yellow-400' : 'text-green-400'}`}>
                            {isOwed ? 'You owe this supplier' : isOverpaid ? 'Overpaid' : 'Fully settled'}
                        </p>
                    </div>
                  <div className="flex flex-col items-end gap-1">
    <button
        onClick={() => setPaymentModal(true)}
        disabled={!isOwed}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
        💰 Pay Supplier
    </button>
    {!isOwed && (
        <p className="text-xs text-gray-500">No balance owed</p>
    )}
</div>
                </div>
            </div>

            {/* Products & Stock */}
<div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-6">
    <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-white font-semibold">
            Products
            <span className="ml-2 text-sm font-normal text-gray-400">
                ({attachedProducts.length})
            </span>
        </h3>
        <button
            onClick={() => {
                setPivotForm({ cost_price: '', is_preferred: false, notes: '' })
                setCart([])
                setSelectedProduct(null)
                setAttachModal(true)
            }}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
        >
            + Add Product
        </button>
    </div>
    {attachedProducts.length > 0 ? (
        <table className="w-full">
            <thead className="bg-gray-800">
                <tr>
                    {['Product', 'Supplier Cost', 'Last Purchase Price', 'Last Purchased' ,'Preferred', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
                {attachedProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-white text-sm font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-white text-sm">
                          {(product.cost_price ?? product.last_purchase_price) 
                            ? `${product.cost_price ?? product.last_purchase_price} EGP` 
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                             {product.last_purchase_price ? `${product.last_purchase_price} EGP` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                            {product.last_purchased_at 
                                ? new Date(product.last_purchased_at).toLocaleDateString() 
                                : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                            {product.is_preferred
                                ? <span className="text-yellow-400">⭐ Preferred</span>
                                : <span className="text-gray-600">—</span>
                            }
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedProduct(product)
                                    setPivotForm({
                                        cost_price: product.cost_price ?? '',
                                        is_preferred: product.is_preferred ?? false,
                                        notes: product.notes ?? ''
                                    })
                                    setEditModal(true)
                                }}
                                className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDetach(product.id)}
                                disabled={detaching === product.id}
                                className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                                {detaching === product.id ? '...' : 'Remove'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    ) : (
        <div className="text-center py-10 text-gray-500 text-sm">
            No products linked to this supplier yet.
        </div>
    )}
</div>

            {/* Purchase Orders */}
            <h3 className="text-white font-semibold mb-4">Purchase Orders</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-6">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Invoice', 'Total', 'Paid', 'Remaining', 'Status', 'Date'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {purchaseOrders.map(order => {
                            const paid = order.total - order.amount_remaining
                            return (
                                <tr
                                    key={order.id}
                                    onClick={() => navigate(`/purchase-orders/${order.id}`)}
                                    className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                                        {order.invoice_number}
                                    </td>
                                    <td className="px-4 py-3 text-white text-sm">{order.total} EGP</td>
                                    <td className="px-4 py-3 text-green-400 text-sm">{paid} EGP</td>
                                    <td className="px-4 py-3 text-red-400 text-sm">{order.amount_remaining} EGP</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            order.status === 'paid'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {purchaseOrders.length === 0 && (
                    <div className="text-center py-16 text-gray-500">No orders yet.</div>
                )}
            </div>

            {/* Transaction History */}
            <h3 className="text-white font-semibold mb-4">Transaction History</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['Type', 'Amount', 'Description', 'Date'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {history && history.map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeStyles[entry.type] || 'bg-gray-700 text-gray-300'}`}>
                                        {entry.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white text-sm">{entry.amount} EGP</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{entry.description || '—'}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {new Date(entry.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!history || history.length === 0) && (
                    <div className="text-center py-16 text-gray-500">No transactions yet.</div>
                )}
            </div>

            {/* Payment Modal */}
            <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="💰 Pay Supplier">
                <div className="space-y-4">
                    {unpaidOrders.length > 0 && (
                        <div className="space-y-1">
                            {unpaidOrders.map((o, i) => (
                                <div key={o.id} className="flex justify-between text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
                                    <span>#{i + 1} — {o.invoice_number}</span>
                                    <span>{o.amount_remaining ?? o.total} EGP</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handlePayment} className="space-y-4">
                        {unpaidOrders.length > 0 && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Pay Specific Order
                                    <span className="text-gray-600 ml-1">(optional — leave blank for FIFO)</span>
                                </label>
                                <select
                                    value={payForm.purchase_order_id}
                                    onChange={(e) => setPayForm({ ...payForm, purchase_order_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                >
                                    <option value="">Pay oldest first (auto)</option>
                                    {unpaidOrders.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.invoice_number} — {o.amount_remaining ?? o.total} EGP
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={payForm.amount}
                                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                    placeholder="e.g. 500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Method</label>
                                <select
                                    value={payForm.method}
                                    onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="check">Check</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setPaymentModal(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !payForm.amount}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {saving ? 'Processing...' : 'Pay Supplier'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

      <Modal open={attachModal} onClose={() => { setAttachModal(false); setCart([]) }} title="Link Products to Supplier">
    <div className="space-y-4">
        {/* Search */}
        <div>
            <label className="block text-sm text-gray-400 mb-1">Search & Add Products</label>
            <ProductSearchInput
                products={allProducts
                    .filter(p => !cart.find(c => c.id === p.id))
                    .filter(p => !attachedProducts.find(a => a.id === p.id))
                }
                showCostPrice={true}
                onSelect={addToCart}
                placeholder="Search by name or SKU..."
            />
            {allProducts.filter(p => !attachedProducts.find(a => a.id === p.id)).length === 0 && (
                <p className="text-yellow-400 text-xs mt-1">
                    ✓ All your products are already linked to this supplier
                </p>
            )}
        </div>

        {/* Cart */}
        {cart.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs text-gray-500">{cart.length} product(s) selected</p>
               {cart.map(item => (
    <div key={item.id} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-3">
        <span className="text-white text-sm font-medium flex-1">{item.name}</span>
        <div className="flex flex-col gap-1">
    <span className="text-gray-500 text-[10px]">Supplier Cost</span>
    <input
        type="number"
        value={item.cost_price}
        onChange={e => updateCartItem(item.id, 'cost_price', e.target.value)}
        step="0.01"
        min="0"
        className="w-28 px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
        placeholder="0.00"
    />
</div>
        <button
            onClick={() => updateCartItem(item.id, 'is_preferred', !item.is_preferred)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                item.is_preferred
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    : 'bg-gray-700 text-gray-500 border border-gray-600 hover:text-gray-300'
            }`}
        >
            ⭐ Preferred
        </button>
        <button
            onClick={() => removeFromCart(item.id)}
            className="text-gray-600 hover:text-red-400 text-xs transition-colors"
        >
            ✕
        </button>
    </div>
))}
            </div>
        )}

        {cart.length === 0 && (
            <div className="text-center py-4 text-gray-600 text-sm">
                No products selected yet
            </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
            <button
                onClick={() => { setAttachModal(false); setCart([]) }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
                Cancel
            </button>
            <button
                onClick={handleBulkAttach}
                disabled={saving || cart.length === 0}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
                {saving ? 'Saving...' : `Link ${cart.length > 0 ? cart.length : ''} Product(s)`}
            </button>
        </div>
    </div>
</Modal>

{/* Edit Product Modal */}
<Modal open={editModal} onClose={() => setEditModal(false)} title={`Edit — ${selectedProduct?.name}`}>
    <div className="space-y-4">
        <div>
            <label className="block text-sm text-gray-400 mb-1">
                Supplier Cost (EGP)
                <span className="text-gray-600 text-xs ml-1 block mt-0.5">What this supplier currently charges</span>
            </label>
            <input
                type="number"
                value={pivotForm.cost_price}
                onChange={e => setPivotForm(f => ({ ...f, cost_price: e.target.value }))}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
            />
        </div>
        <div className="flex items-center gap-2">
            <input
                type="checkbox"
                id="is_preferred_edit"
                checked={pivotForm.is_preferred}
                onChange={e => setPivotForm(f => ({ ...f, is_preferred: e.target.checked }))}
                className="rounded"
            />
            <label htmlFor="is_preferred_edit" className="text-sm text-gray-400">
                ⭐ Mark as preferred supplier for this product
            </label>
        </div>
        <div>
            <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
            <input
                type="text"
                value={pivotForm.notes}
                onChange={e => setPivotForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
            />
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                Cancel
            </button>
            <button
                onClick={handleEdit}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    </div>
</Modal>
        </div>
    )
}