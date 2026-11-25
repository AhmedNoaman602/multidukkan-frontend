// Turns the backend's cancellation preview into the choices the cancel dialog shows.
// The backend decides again under its locks; this only mirrors its answer.
export function settlementOptions(summary) {
    if (!summary) return { blockedReason: null, options: [], preselected: null }

    if (summary.blocked_reason) {
        return { blockedReason: summary.blocked_reason, options: [], preselected: null }
    }

    if (!summary.settlement_required) {
        return { blockedReason: null, options: [], preselected: null }
    }

    const options = summary.settlements.map(value => ({
        value,
        disabledReason: value === 'cash'
            ? (summary.cash_payout_available ? null : 'credit_payout_unavailable')
            : (summary.credit_blocked_reason ?? null),
    }))
    const enabled = options.filter(o => o.disabledReason === null)

    return {
        blockedReason: enabled.length === 0 ? 'no_settlement_available' : null,
        options,
        preselected: enabled.length === 1 ? enabled[0].value : null,
    }
}

export function canConfirmCancel(choices, selected) {
    if (choices.blockedReason) return false
    if (choices.options.length === 0) return true

    return choices.options.some(o => o.value === selected && o.disabledReason === null)
}
