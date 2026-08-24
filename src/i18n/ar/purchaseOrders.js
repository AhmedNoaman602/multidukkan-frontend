// بتعتمد بشكل كبير على common.* وorders.* — أوامر الشراء بتشارك تقريباً كل
// المفردات مع طلبات البيع (أوضاع الفلترة، مودال الدفع، الـ tooltip، الترقيم).
// النصوص الخاصة بأوامر الشراء بس هي اللي عايشة هنا.
export default {
    title: 'أوامر الشراء',
    newOrder: '+ أمر شراء جديد',
    totalOrders: 'إجمالي الأوامر',
    totalSpent: 'إجمالي المصروف',
    itemsCount: 'الأصناف: {count}',
    empty: 'مفيش أوامر شراء لسه.',
    emptyFiltered: 'مفيش أوامر مطابقة للتصفية.',
    loadFailed: 'حصلت مشكلة في تحميل أوامر الشراء',

    create: {
        title: 'إنشاء أمر شراء جديد',
        backToOrders: 'رجوع لأوامر الشراء',
        orderDate: 'تاريخ أمر الشراء',
        selectSupplierFirst: 'اختر المورد أولاً',
        supplierChanged: '⚠️ المورد اتغير — الأسعار تحت ممكن تكون قديمة. امسح المنتج وضيفه تاني عشان السعر يتحدث.',
        creating: 'جاري الإنشاء...',
        submit: 'إنشاء الأمر',
        itemRequired: 'ضيف صنف واحد على الأقل.',
        storeRequired: 'من فضلك اختر المتجر.',
        createFailed: 'حصلت مشكلة في إنشاء الأمر',
    },

    detail: {
        cancelOrder: 'إلغاء الأمر',
        loadFailed: 'حصلت مشكلة في تحميل أمر الشراء',
        cancelFailed: 'حصلت مشكلة في إلغاء أمر الشراء',
        orderItems: 'أصناف الأمر',
        cancelConfirmTitle: 'إلغاء أمر الشراء؟',
        cancelConfirmWarning: 'ده هيعكس القيد في حساب المورد ويخصم من المخزون. مش هتقدر ترجع في الخطوة دي.',
        keepOrder: 'سيب الأمر',
        cancelling: 'جاري الإلغاء...',
        yesCancel: 'أيوة، الغِ',
    },

    invoice: {
        loadFailed: 'حصلت مشكلة في تحميل أمر الشراء',
        notFound: 'أمر الشراء غير موجود',
        heading: 'أمر شراء',
    },
}
