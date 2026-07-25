import Modal from './Modal'
import OrderSearchInput from './OrderSearchInput'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../hooks/useToast'

const methodLabel = {
    cash:          'Cash',
    bank_transfer: 'Bank Transfer',
    check:         'Check',
}

export default function ReverseSupplierPaymentModal({
    open,
    onClose,
    orders,
    payments,
    onSuccess
}) {
    const [reverseForm, setReverseForm] = useState({ order_id: '', payment_id: '' })
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        if (!open) {
            setReverseForm({ order_id: '', payment_id: '' })
        }
        // Auto-set order when only one order has payments
        if (open && orders.length === 1) {
            setReverseForm(f => ({ ...f, order_id: String(orders[0].id) }))
        }
    }, [open, orders])

    // Filter payments by selected order
    const filteredPayments = (payments ?? []).filter(p =>
        reverseForm.order_id ? p.purchase_order_id === parseInt(reverseForm.order_id) : true
    )

    const selected = filteredPayments.find(p => p.id === parseInt(reverseForm.payment_id))

    const handleReverse = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.delete(`/supplier-payments/${reverseForm.payment_id}`)
            showToast('Payment reversed successfully.', 'success')
            setReverseForm({ order_id: '', payment_id: '' })
            onClose()
            onSuccess()
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reverse payment', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal open={open} onClose={onClose} title="↩ Reverse Payment">
            <div className="space-y-4">
                {payments.length === 0 ? (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-400 text-sm">No payments found.</p>
                    </div>
                ) : (
                    <form onSubmit={handleReverse} className="space-y-4">

                        {/* Order selector with search — only when multiple orders */}
                        {orders.length > 1 && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Select Order
                                </label>
                                <OrderSearchInput
                                    orders={orders}
                                    value={reverseForm.order_id}
                                    onSelect={(orderId) => setReverseForm({
                                        ...reverseForm,
                                        order_id: orderId,
                                        payment_id: '',
                                    })}
                                    renderMeta={(o) => `${o.total} EGP`}
                                />
                            </div>
                        )}

                        {/* Payment selector — filtered by selected order */}
                        {reverseForm.order_id && (
                            filteredPayments.length > 0 ? (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">
                                        Select Payment
                                    </label>
                                    <select
                                        value={reverseForm.payment_id}
                                        onChange={e => setReverseForm({ ...reverseForm, payment_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                                    >
                                        <option value="">Select a payment</option>
                                        {filteredPayments.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.amount} EGP — {methodLabel[p.method] ?? p.method}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <p className="text-yellow-400 text-sm">No payments on this order.</p>
                                </div>
                            )
                        )}

                        {selected && (
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-blue-400 text-sm">
                                    This will fully reverse <span className="font-bold">{selected.amount} EGP</span> paid
                                    on {selected.invoice_number}.
                                    <span className="text-blue-600 text-xs ml-1">Supplier payments can only be reversed in full — this cannot be undone.</span>
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving || !reverseForm.payment_id}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                {saving ? 'Processing...' : 'Reverse Payment'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    )
}
