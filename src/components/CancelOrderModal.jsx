import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'
import api from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency } from '../lib/format'
import { canConfirmCancel, settlementOptions } from '../lib/cancellation'

function firstError(err) {
    const errors = err.response?.data?.errors
    const first = errors && Object.values(errors)[0]

    return (Array.isArray(first) ? first[0] : first) || err.response?.data?.message || null
}

export default function CancelOrderModal({ orderId, invoice, onClose, onCancelled }) {
    const { t, lang } = useTranslation()
    const [selected, setSelected] = useState(null)
    const [cancelling, setCancelling] = useState(false)
    const [error, setError] = useState(null)

    const { data: summary, isLoading, isError, refetch } = useQuery({
        queryKey: ['orders', orderId, 'cancellation'],
        queryFn: () => api.get(`/orders/${orderId}/cancellation`).then(res => res.data.data),
        staleTime: 0,
        gcTime: 0,
    })

    const choices = settlementOptions(summary)
    const choice = selected ?? choices.preselected
    const canConfirm = !!summary && canConfirmCancel(choices, choice)

    const handleConfirm = async (e) => {
        e.preventDefault()
        if (!canConfirm) return

        setCancelling(true)
        setError(null)
        try {
            await api.post(`/orders/${orderId}/cancel`, choices.options.length > 0 ? { settlement: choice } : {})
            onCancelled()
        } catch (err) {
            setError(firstError(err) || t('orders.detail.cancelFailed'))
            setSelected(null)
            refetch()
        } finally {
            setCancelling(false)
        }
    }

    const reasonText = (reason) => {
        if (reason === 'credit_payout_unavailable') {
            return t('orders.cancelModal.cashUnavailable', {
                amount:    formatCurrency(summary.credit_paid, lang),
                available: formatCurrency(summary.available_for_payout, lang),
            })
        }

        return t(`orders.cancelModal.reasons.${reason}`)
    }

    const row = (label, value, className = 'text-white') => (
        <div className="flex justify-between text-sm">
            <span className="text-gray-400">{label}</span>
            <span className={className}>{formatCurrency(value, lang)}</span>
        </div>
    )

    return (
        <Modal open onClose={onClose} title={t('orders.cancelModal.title', { invoice })} error={error}>
            {isLoading && <LoadingSpinner />}

            {isError && <p className="text-red-400 text-sm">{t('orders.cancelModal.loadFailed')}</p>}

            {summary && (
                <form onSubmit={handleConfirm} className="space-y-4">
                    <div className="bg-gray-800/50 border border-gray-800 rounded-lg p-4 space-y-2">
                        {row(t('orders.cancelModal.total'), summary.total)}
                        {summary.cash_paid > 0 && row(t('orders.cancelModal.cashPaid'), summary.cash_paid)}
                        {summary.credit_paid > 0 && row(t('orders.cancelModal.creditPaid'), summary.credit_paid)}
                        {summary.unpaid_reversed > 0 && row(t('orders.cancelModal.unpaidReversed'), summary.unpaid_reversed, 'text-gray-300')}
                    </div>

                    {choices.options.length > 0 && (
                        <fieldset className="space-y-2">
                            <legend className="text-sm text-gray-300 mb-2">
                                {t('orders.cancelModal.howToReturn', { amount: formatCurrency(summary.refundable, lang) })}
                            </legend>

                            {choices.options.map(option => {
                                const disabled = option.disabledReason !== null
                                const checked = choice === option.value

                                return (
                                    <label
                                        key={option.value}
                                        className={`block border rounded-lg px-4 py-3 transition-colors ${
                                            disabled
                                                ? 'border-gray-800 opacity-60 cursor-not-allowed'
                                                : checked
                                                    ? 'border-red-500/60 bg-red-500/5 cursor-pointer'
                                                    : 'border-gray-700 hover:border-gray-600 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="radio"
                                                name="settlement"
                                                value={option.value}
                                                checked={checked}
                                                disabled={disabled}
                                                onChange={() => setSelected(option.value)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <p className="text-white text-sm font-medium">
                                                    {t(`orders.cancelModal.options.${option.value}.label`)}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-0.5">
                                                    {t(`orders.cancelModal.options.${option.value}.hint`, {
                                                        amount: formatCurrency(summary.refundable, lang),
                                                    })}
                                                </p>
                                                {disabled && (
                                                    <p className="text-yellow-400 text-xs mt-1">{reasonText(option.disabledReason)}</p>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                )
                            })}
                        </fieldset>
                    )}

                    {choices.blockedReason ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3">
                            <p className="text-yellow-400 text-sm">{t(`orders.cancelModal.reasons.${choices.blockedReason}`)}</p>
                        </div>
                    ) : (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
                            <p className="text-red-400 text-xs">{t('orders.cancelModal.warning')}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {t('orders.cancelModal.keep')}
                        </button>
                        <button
                            type="submit"
                            disabled={!canConfirm || cancelling}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {cancelling ? t('orders.cancelModal.cancelling') : t('orders.cancelModal.confirm')}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    )
}
