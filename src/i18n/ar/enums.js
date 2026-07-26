// أسماء العرض لقيم الـ enums القادمة من الباك إند. المفاتيح هي القيم الخام
// اللي بيبعتها الـ API وجزء من عقد الـ API — ممنوع ترجمة أو تغيير أي مفتاح،
// النص المعروض للمستخدم بس هو اللي بيتترجم.

export default {
    role: {
        tenant_admin: 'صاحب المتجر',
        store_manager: 'مدير المتجر',
        store_staff: 'موظف',
    },

    paymentMethod: {
        cash: 'نقدي',
        bank_transfer: 'تحويل بنكي',
        instapay: 'إنستاباي',
        vodafone_cash: 'فودافون كاش',
        orange_cash: 'أورنج كاش',
        check: 'شيك',
    },

    // بيان رقم المرجع المطلوب حسب طريقة الدفع.
    paymentReference: {
        bank_transfer: 'رقم الحوالة',
        instapay: 'رقم العملية',
        vodafone_cash: 'رقم المُرسِل',
        orange_cash: 'رقم المُرسِل',
        check: 'رقم الشيك',
    },

    orderStatus: {
        paid: 'مدفوع',
        unpaid: 'غير مدفوع',
    },

    // نوع سجل النشاط بيجمع تلات مصادر (فلوس / مخزون / تعديلات)، فالمفاتيح
    // مطابقة لـ typeStyles في lib/auditLog.js بالظبط.
    auditType: {
        ORDER_CHARGE: 'قيد طلب',
        PAYMENT: 'دفعة',
        REVERSAL: 'عكس قيد',
        CREDIT_APPLY: 'إضافة رصيد',
        CREDIT_CONSUMED: 'استخدام رصيد',
        REFUND: 'مرتجع',
        PURCHASE_CHARGE: 'قيد شراء',
        PURCHASE_REVERSAL: 'عكس قيد شراء',
        SUPPLIER_PAYMENT: 'دفعة لمورد',
        SUPPLIER_PAYMENT_REVERSAL: 'عكس دفعة مورد',
        SALE: 'بيع',
        RETURN: 'مرتجع مخزون',
        TRANSFER_IN: 'تحويل وارد',
        TRANSFER_OUT: 'تحويل صادر',
        ADJUSTMENT_IN: 'تسوية إضافة',
        ADJUSTMENT_OUT: 'تسوية خصم',
        PURCHASE_IN: 'وارد مشتريات',
        PURCHASE_OUT: 'صادر مشتريات',
        created: 'إنشاء',
        updated: 'تعديل',
        deleted: 'حذف',
    },

    // الـ API بيبعت class_basename()، يعني أسماء موديلات مختصرة.
    auditEntity: {
        Product: 'منتج',
        Customer: 'عميل',
        Supplier: 'مورد',
        Store: 'متجر',
        Order: 'طلب',
        PurchaseOrder: 'أمر شراء',
        Expense: 'مصروف',
    },

    // المفاتيح مطابقة لـ Expense::CATEGORIES في الباك إند بالظبط.
    expenseCategory: {
        SALARIES: 'رواتب',
        RENT: 'إيجار',
        UTILITIES: 'مرافق',
        TRANSPORTATION: 'مواصلات',
        INTERNET: 'إنترنت',
        MAINTENANCE: 'صيانة',
        SUPPLIES: 'مستلزمات',
        MISCELLANEOUS: 'متنوعات',
    },
}
