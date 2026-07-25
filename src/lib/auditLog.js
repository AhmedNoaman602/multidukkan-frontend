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

// Arabic labels for the `type` field. It is a union across three sources
// (ledger / inventory / audit), so the keys mirror typeStyles exactly.
export const typeLabels = {
  // ledger
  ORDER_CHARGE: 'قيد طلب',
  PAYMENT: 'دفعة',
  REVERSAL: 'عكس قيد',
  CREDIT_APPLY: 'إضافة رصيد',
  CREDIT_CONSUMED: 'استخدام رصيد',
  REFUND: 'مرتجع',
  PURCHASE_CHARGE: 'قيد شراء',
  PURCHASE_REVERSAL: 'عكس قيد شراء',
  SUPPLIER_PAYMENT: 'دفعة لمورد',
  // inventory
  SALE: 'بيع',
  RETURN: 'مرتجع مخزون',
  TRANSFER_IN: 'تحويل وارد',
  TRANSFER_OUT: 'تحويل صادر',
  ADJUSTMENT_IN: 'تسوية إضافة',
  ADJUSTMENT_OUT: 'تسوية خصم',
  PURCHASE_IN: 'وارد مشتريات',
  PURCHASE_OUT: 'صادر مشتريات',
  // audit (record edits)
  created: 'إنشاء',
  updated: 'تعديل',
  deleted: 'حذف',
}

// The API sends class_basename(), so these are short model names — not FQCNs.
export const entityLabels = {
  Product: 'منتج',
  Customer: 'عميل',
  Supplier: 'مورد',
  Store: 'متجر',
  Order: 'طلب',
  PurchaseOrder: 'أمر شراء',
  Expense: 'مصروف',
}

export function humanizeField(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getInitials(name) {
  if (!name) return 'SY'
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('')
  return initials || 'SY'
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function groupByDay(rows) {
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
    if (sameDay(rowDate, today)) label = 'النهاردة'
    else if (sameDay(rowDate, yesterday)) label = 'إمبارح'
    else label = rowDate.toLocaleDateString('en-GB')

    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.label === label) {
      lastGroup.rows.push(row)
    } else {
      groups.push({ label, rows: [row] })
    }
  }
  return groups
}
