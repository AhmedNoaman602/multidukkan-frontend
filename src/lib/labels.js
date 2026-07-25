// DEPRECATED — compatibility shim, do not add anything here.
//
// Enum labels now live in src/i18n/{en,ar}/enums.js and are read through
// t(`enums.role.${user.role}`) etc. Pages that haven't been migrated to
// useTranslation() yet still import these maps, so they re-export the Arabic
// bundle to keep a single source of truth (no duplicated Arabic strings).
//
// Delete this file once nothing imports it.

import ar from '../i18n/ar/enums'

export const roleLabels = ar.role
export const paymentMethodLabels = ar.paymentMethod
export const paymentReferenceLabels = ar.paymentReference
export const expenseCategoryLabels = ar.expenseCategory
