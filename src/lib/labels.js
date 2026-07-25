// Arabic display labels for backend enum values. Keys are the raw values the
// API sends — never translate the keys themselves, only what the user sees.

export const roleLabels = {
  tenant_admin: 'صاحب المتجر',
  store_manager: 'مدير المتجر',
  store_staff: 'موظف',
}

export const paymentMethodLabels = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  instapay: 'إنستاباي',
  vodafone_cash: 'فودافون كاش',
  orange_cash: 'أورنج كاش',
  check: 'شيك',
}

// Which reference field to ask for, per payment method.
export const paymentReferenceLabels = {
  bank_transfer: 'رقم الحوالة',
  instapay: 'رقم العملية',
  vodafone_cash: 'رقم المُرسِل',
  orange_cash: 'رقم المُرسِل',
  check: 'رقم الشيك',
}
