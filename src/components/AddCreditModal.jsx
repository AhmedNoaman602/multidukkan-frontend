import { useState } from 'react'
import api from '../api/axios'
import Modal from './Modal'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'

export default function AddCreditModal({ customer, onClose, onSuccess }) {
    const [amount, setAmount]           = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading]         = useState(false)
    const {showToast} = useToast();
    const { t } = useTranslation()
    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showToast(t('customers.balance.invalidAmount'), 'error')
            return
        }
        setLoading(true)
        try {
            await api.post(`/customers/${customer.customer_id}/credit`, {
                amount: parseFloat(amount),
                description: description || t('customers.balance.manualCreditDefault'),
            })
            onSuccess()
            onClose()
        } catch (err){
            showToast(err.response?.data?.message || t('customers.balance.addCreditFailed'), 'error');
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal open={true} onClose={onClose} title={t('customers.balance.addCreditTitle', { name: customer.customer_name })}>
            <div className="space-y-3">
                <div>
                    <label className="text-gray-400 text-sm">{t('common.amount')} ({t('common.currency')})</label>
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
                    <label className="text-gray-400 text-sm">{t('customers.balance.noteOptional')}</label>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        placeholder={t('customers.balance.notePlaceholder')}
                    />
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    onClick={onClose}
                    className="flex-1 bg-gray-700 text-gray-300 rounded-lg py-2 hover:bg-gray-600 text-sm"
                >
                    {t('common.cancel')}
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                    {loading ? t('common.saving') : t('customers.balance.addCreditSubmit')}
                </button>
            </div>
        </Modal>
    )
}
