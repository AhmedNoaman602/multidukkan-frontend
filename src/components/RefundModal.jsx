import Modal from './Modal'
import { useState, useEffect} from 'react'
import api from '../api/axios'
import {useToast} from '../hooks/useToast'

export default function RefundModal({ 
    open, 
    onClose, 
    orders, 
    customerId, 
    onSuccess
}){
    const [refundForm, setRefundForm] = useState({ amount: '', method: 'cash', order_id: '' })
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()
    // At the top of RefundModal, after useState declarations:
useEffect(() => {
    if (orders.length === 1) {
        setRefundForm(f => ({
            ...f,
            order_id: String(orders[0].id),
            amount:   String(orders[0].paid),
        }))
    }
}, [orders])


const handleRefund = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
        await api.post(`/customers/${customerId}/refund`, {
            amount: parseFloat(refundForm.amount),
            method: refundForm.method,
            ...(refundForm.order_id && { order_id: parseInt(refundForm.order_id) }),
        })
        showToast('Refund issued successfully.', 'success')
        setRefundForm({ amount: '', method: 'cash', order_id: '' })
        onClose()
        onSuccess()
    } catch (err) {
        showToast(err.response?.data?.message || 'Failed to issue refund', 'error')
    } finally {
        setSaving(false)
    }
}

        return(
            <Modal open={open} onClose={onClose} title="↩ Issue Refund">
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-yellow-400 text-sm">No payments found. Refund will apply against available credit.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {orders.map((o, i) => (
                                <div key={o.id} className="flex justify-between text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
                                    <span>#{i + 1} — {o.invoice_number}</span>
                                    <span className="text-green-400">{o.paid} EGP paid</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleRefund} className="space-y-4">
                        {orders.length > 1 && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Refund Specific Order
                                </label>
                                <select value={refundForm.order_id}
                                    onChange={e => {
                                        const order = orders.find(o => o.id === parseInt(e.target.value))
                                        setRefundForm({
                                            ...refundForm,
                                            order_id: e.target.value,
                                            amount: e.target.value ? String(order?.paid ?? '') : '',
                                        })
                                    }}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm">
                                    <option value="">Select an order</option>
                                    {orders.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.invoice_number} — {o.paid} EGP paid
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount</label>
                                <input type="number" value={refundForm.amount}
                                    onChange={e => setRefundForm({ ...refundForm, amount: e.target.value })}
                                    required min="0.01" step="0.01"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                                    placeholder="e.g. 150" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Method</label>
                                <select value={refundForm.method}
                                    onChange={e => setRefundForm({ ...refundForm, method: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-500 text-sm">
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
                </div>
            </Modal>
        )
    }