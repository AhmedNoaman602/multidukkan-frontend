import Modal from './Modal'
import OrderSearchInput from './OrderSearchInput'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../hooks/useToast'

export default function RefundModal({
    open,
    onClose,
    orders,
    payments,
    customerId,
    onSuccess
}) {
    const [refundForm, setRefundForm] = useState({ amount: '', method: 'cash', order_id: '', payment_id_target: '' })
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        if (!open) {
            setRefundForm({ amount: '', method: 'cash', order_id: '', payment_id_target: '' })
        }
        // Auto-set order_id when only one order
        if (open && orders.length === 1) {
            setRefundForm(f => ({ ...f, order_id: String(orders[0].id) }))
        }
    }, [open, orders])

    // Filter payments by selected order
    const filteredPayments = (payments ?? []).filter(p => {
        const hasBalance = (p.amount - (p.refunded_amount ?? 0)) > 0
        const matchesOrder = refundForm.order_id
            ? p.order_id === parseInt(refundForm.order_id)
            : true
         const notCredit = !p.is_auto_reversible
        return hasBalance && matchesOrder && notCredit
    })

    const handleRefund = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post(`/customers/${customerId}/refund`, {
                amount: parseFloat(refundForm.amount),
                method: refundForm.method,
                ...(refundForm.order_id && { order_id: parseInt(refundForm.order_id) }),
                ...(refundForm.payment_id_target && { payment_id_target: parseInt(refundForm.payment_id_target) }),
            })
            showToast('Refund issued successfully.', 'success')
            setRefundForm({ amount: '', method: 'cash', order_id: '', payment_id_target: '' })
            onClose()
            onSuccess()
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to issue refund', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal open={open} onClose={onClose} title="↩ Issue Refund">
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-400 text-sm">No payments found.</p>
                    </div>
                ) : (
                    <form onSubmit={handleRefund} className="space-y-4">

                        {/* Order selector with search — only when multiple orders */}
                        {orders.length > 1 && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Select Order
                                </label>
                                <OrderSearchInput
                                    orders={orders}
                                    value={refundForm.order_id}
                                    onSelect={(orderId) => {
                                        const order = orders.find(o => o.id === parseInt(orderId))
                                        setRefundForm({
                                            ...refundForm,
                                            order_id: orderId,
                                            payment_id_target: '',
                                            amount: orderId ? String(order?.paid ?? '') : '',
                                        })
                                    }}
                                    renderMeta={(o) => `${o.paid} EGP paid (refundable: ${o.refundable} EGP)`}
                                />
                            </div>
                        )}

                        {/* Payment selector — filtered by selected order */}
                        {filteredPayments.length > 0 && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Refund Specific Payment
                                    <span className="text-gray-600 ml-1">(optional)</span>
                                </label>
                                <select
                                    value={refundForm.payment_id_target}
                                    onChange={e => {
                                        const payment = filteredPayments.find(p => p.id === parseInt(e.target.value))
                                        setRefundForm({
                                            ...refundForm,
                                            payment_id_target: e.target.value,
                                            amount: e.target.value
                                                ? String(payment.amount - (payment.refunded_amount ?? 0))
                                                : refundForm.amount
                                        })
                                    }}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                                >
                                    <option value="">Refund across all payments (auto)</option>
                                    {filteredPayments.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.invoice_number} — {p.amount - (p.refunded_amount ?? 0)} EGP net
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                    {refundForm.order_id && (() => {
    const selected = orders.find(o => o.id === parseInt(refundForm.order_id))
    return selected ? (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
                Available to refund: <span className="font-bold">{selected.refundable ?? selected.paid} EGP</span>
                <span className="text-blue-600 text-xs ml-2">(cash payments only)</span>
            </p>
        </div>
    ) : null
})()}

                        {/* Amount + Method */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={refundForm.amount}
                                    onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })}
                                    required min="0.01" step="0.01"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                                    placeholder="e.g. 150"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Method</label>
                                <select
                                    value={refundForm.method}
                                    onChange={e => setRefundForm({ ...refundForm, method: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="check">Check</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving || !refundForm.amount}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                {saving ? 'Processing...' : 'Issue Refund'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    )
}