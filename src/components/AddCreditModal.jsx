import { useState } from 'react'
import api from '../api/axios'
import Modal from './Modal'
import { useToast } from '../hooks/useToast'

export default function AddCreditModal({ customer, onClose, onSuccess }) {
    const [amount, setAmount]           = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading]         = useState(false)
    const {showToast} = useToast();
    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showToast('اكتب مبلغ صحيح', 'error')
            return
        }
        setLoading(true)
        try {
            await api.post(`/customers/${customer.customer_id}/credit`, {
                amount: parseFloat(amount),
                description: description || 'رصيد يدوي',
            })
            onSuccess()
            onClose()
        } catch (err){
            showToast(err.response?.data?.message || 'حصلت مشكلة في إضافة الرصيد', 'error');
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal open={true} onClose={onClose} title={`Add Credit — ${customer.customer_name}`}>
            <div className="space-y-3">
                <div>
                    <label className="text-gray-400 text-sm">Amount (ج.م)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        placeholder="0.00"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="text-gray-400 text-sm">Note (optional)</label>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        placeholder="e.g. Advance payment"
                    />
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    onClick={onClose}
                    className="flex-1 bg-gray-700 text-gray-300 rounded-lg py-2 hover:bg-gray-600 text-sm"
                >
                    إلغاء
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                    {loading ? 'جاري الحفظ...' : 'إضافة الرصيد'}
                </button>
            </div>
        </Modal>
    )
}