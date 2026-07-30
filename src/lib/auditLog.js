import { formatDate } from './format'

export const typeStyles = {
  // ledger
  ORDER_CHARGE: 'bg-red-500/20 text-red-400',
  PAYMENT: 'bg-green-500/20 text-green-400',
  REVERSAL: 'bg-yellow-500/20 text-yellow-400',
  CREDIT_APPLY: 'bg-blue-500/20 text-blue-400',
  CREDIT_CONSUMED: 'bg-purple-500/20 text-purple-400',
  REFUND: 'bg-orange-500/20 text-orange-400',
  PURCHASE_CHARGE: 'bg-red-500/20 text-red-400',
  PURCHASE_REVERSAL: 'bg-yellow-500/20 text-yellow-400',
  SUPPLIER_PAYMENT: 'bg-green-500/20 text-green-400',
  // inventory
  SALE: 'bg-blue-500/20 text-blue-400',
  RETURN: 'bg-teal-500/20 text-teal-400',
  TRANSFER_IN: 'bg-cyan-500/20 text-cyan-400',
  TRANSFER_OUT: 'bg-orange-500/20 text-orange-400',
  ADJUSTMENT_IN: 'bg-green-500/20 text-green-400',
  ADJUSTMENT_OUT: 'bg-red-500/20 text-red-400',
  PURCHASE_IN: 'bg-indigo-500/20 text-indigo-400',
  PURCHASE_OUT: 'bg-amber-500/20 text-amber-400',
  // audit (record edits)
  created: 'bg-green-500/20 text-green-400',
  updated: 'bg-blue-500/20 text-blue-400',
  deleted: 'bg-red-500/20 text-red-400',
}

// Display labels for `type` and `auditable_type` live in
// src/i18n/{en,ar}/enums.js under auditType / auditEntity — read them with
// t(`enums.auditType.${row.type}`).

export function humanizeField(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getInitials(name) {
  if (!name) return 'SY'
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('')
  return initials || 'SY'
}

// Group labels are localized, so the caller passes in `t` and `lang` rather
// than this module reaching into the i18n context itself.
export function groupByDay(rows, t, lang) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const groups = []
  for (const row of rows) {
    const rowDate = new Date(row.created_at)
    let label
    if (sameDay(rowDate, today)) label = t('auditLog.days.today')
    else if (sameDay(rowDate, yesterday)) label = t('auditLog.days.yesterday')
    else label = formatDate(rowDate, lang)

    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.label === label) {
      lastGroup.rows.push(row)
    } else {
      groups.push({ label, rows: [row] })
    }
  }
  return groups
}
