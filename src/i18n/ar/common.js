// المفردات المشتركة في الواجهة. أي نص يُستخدم في أكثر من شاشة يعيش هنا —
// ممنوع تكرار نفس النص داخل ملف خاص بميزة معينة.

export default {
    // الأزرار والإجراءات — مصادر، مش أفعال أمر
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    deleting: 'جاري الحذف...',
    add: 'إضافة',
    close: 'إغلاق',
    clearFilters: 'مسح الفلاتر',

    // مودال تأكيد الحذف (شوف components/DeleteModal.jsx)
    deleteItem: 'حذف العنصر',
    confirmDelete: 'متأكد إنك عايز تحذف {name}؟ الخطوة دي مش هتقدر ترجع فيها.',
    yesDelete: 'أيوة، احذف',

    back: 'رجوع',
    from: 'من',
    search: 'بحث...',
    invoice: 'الفاتورة',
    items: 'الأصناف',
    quickSale: 'بيع سريع',
    paymentsCount: 'الدفعات: {count}',

    // الفلاتر
    to: 'إلى',
    allStores: 'كل المتاجر',

    // الجداول والقوائم
    actions: 'إجراءات',
    date: 'التاريخ',
    time: 'الوقت',
    store: 'المتجر',
    amount: 'المبلغ',
    total: 'الإجمالي',
    remaining: 'المتبقي',
    status: 'الحالة',
    customer: 'العميل',
    supplier: 'المورد',
    createdBy: 'بواسطة',
    description: 'الوصف',
    notes: 'ملاحظات',
    optional: 'اختياري',
    all: 'الكل',
    viewAll: 'عرض الكل',
    quantity: 'الكمية',
    product: 'المنتج',
    warehouse: 'المخزن',
    name: 'الاسم',
    code: 'الكود',
    phone: 'التليفون',
    address: 'العنوان',
    area: 'المنطقة',
    type: 'النوع',
    payments: 'الدفعات',
    transactionHistory: 'سجل المعاملات',
    refunded: 'المسترد',
    net: 'الصافي',
    reference: 'المرجع',

    // ترقيم الصفحات
    previous: 'السابق',
    next: 'التالي',
    pageOf: 'صفحة {page} من {total}',

    // أسماء الشهور، مرتبة من 0 لـ11 (Date().getMonth())
    months: [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
    ],

    // التنسيق
    currency: 'ج.م',
}
