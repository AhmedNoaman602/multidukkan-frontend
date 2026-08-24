import { useState } from 'react'
import api from '../api/axios'
import Modal from './Modal'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { EXPENSE_CATEGORIES } from '../lib/enums'

const todayStr = () => new Date().toLocaleDateString('en-CA')

export default function ExpenseModal({ expense, stores, isAdmin, onClose, onSuccess }) {
    const isEdit = !!expense
    const [form, setForm] = useState({
        category: expense?.category || '',
        amount: expense?.amount ?? '',
        description: expense?.description || '',
        expense_date: expense?.expense_date || todayStr(),
        store_id: expense?.store?.id ?? '',
    })
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()
    const { t } = useTranslation()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.category) {
            showToast(t('expenses.categoryRequired'), 'error')
            return
        }
        if (!form.amount || parseFloat(form.amount) <= 0) {
            showToast(t('expenses.amountInvalid'), 'error')
            return
        }
        if (form.category === 'MISCELLANEOUS' && !form.description.trim()) {
            showToast(t('expenses.descriptionRequired'), 'error')
            return
        }

        setSaving(true)
        try {
            const payload = {
                category: form.category,
                amount: parseFloat(form.amount),
                description: form.description.trim() || null,
                expense_date: form.expense_date,
            }
            if (isAdmin && !isEdit) {
                payload.store_id = form.store_id || null
            }

            if (isEdit) {
                await api.patch(`/expenses/${expense.id}`, payload)
                showToast(t('expenses.updated'), 'success')
            } else {
                await api.post('/expenses', payload)
                showToast(t('expenses.created'), 'success')
            }
            onSuccess()
            onClose()
        } catch (err) {
            showToast(err.response?.data?.message || t('expenses.saveFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal open={true} onClose={onClose} title={isEdit ? t('expenses.editExpense') : t('expenses.newExpense')}>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="text-gray-400 text-sm">{t('expenses.category')}</label>
                    <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                    >
                        <option value="">{t('expenses.chooseCategory')}</option>
                        {EXPENSE_CATEGORIES.map(value => (
                            <option key={value} value={value}>{t(`enums.expenseCategory.${value}`)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-gray-400 text-sm">{t('expenses.amountWithCurrency')}</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label className="text-gray-400 text-sm">{t('common.date')}</label>
                    <input
                        type="date"
                        value={form.expense_date}
                        max={todayStr()}
                        onChange={e => setForm({ ...form, expense_date: e.target.value })}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                    />
                </div>

                {isAdmin && !isEdit && (
                    <div>
                        <label className="text-gray-400 text-sm">
                            {t('common.store')} ({t('common.optional')})
                        </label>
                        <select
                            value={form.store_id}
                            onChange={e => setForm({ ...form, store_id: e.target.value })}
                            className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        >
                            <option value="">{t('expenses.generalExpense')}</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="text-gray-400 text-sm">
                        {t('common.notes')} {form.category === 'MISCELLANEOUS' && <span className="text-red-400">*</span>}
                    </label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={2}
                        className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm resize-none"
                        placeholder={t('expenses.notesPlaceholder')}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-gray-700 text-gray-300 rounded-lg py-2 hover:bg-gray-600 text-sm"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                        {saving ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
