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
