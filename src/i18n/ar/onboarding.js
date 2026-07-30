export default {
    welcome: {
        greeting: '👋 أهلاً بك يا',
        subtitle: 'سنساعدك في إعداد متجرك في دقيقتين. كل شيء يمكن تعديله لاحقاً.',
        checklist: {
            createStore: 'إنشاء المتجر',
            createWarehouse: 'إنشاء المخزن',
            addProduct: 'إضافة منتج',
            addCustomer: 'إضافة عميل',
            addStaff: 'إضافة موظف',
        },
    },

    store: {
        stepLabel: 'الخطوة 1 من 5',
        title: 'أنشئ متجرك الأول',
        subtitle: 'هذه هي نقطة البيع الرئيسية التي ستُسجَّل منها الطلبات.',
        nameRequired: 'اسم المتجر *',
        namePlaceholder: 'مثال: الفرع الرئيسي',
        addressPlaceholder: 'مثال: الإسكندرية',
        phoneLabel: 'رقم الهاتف',
        phonePlaceholder: '01xxxxxxxxx',
    },

    warehouse: {
        stepLabel: 'الخطوة 2 من 5',
        title: 'أنشئ مخزنك الأول',
        subtitle: 'المكان الذي ستتابع منه المخزون — يمكنك إضافة مخازن أخرى لاحقاً.',
        nameRequired: 'اسم المخزن *',
        namePlaceholder: 'مثال: المخزن الرئيسي',
        addressPlaceholder: 'مثال: المخزن الرئيسي - الإسكندرية',
    },

    product: {
        stepLabel: 'الخطوة 3 من 5 · اختياري',
        title: 'أضف أول منتج',
        subtitle: 'يمكنك إضافة المزيد من المنتجات لاحقاً من صفحة المنتجات.',
        nameRequired: 'اسم المنتج *',
        namePlaceholder: 'مثال: شاكوش كبير',
        skuRequired: 'كود المنتج (SKU) *',
        skuPlaceholder: 'مثال: HAM-001',
        priceRequired: 'سعر البيع *',
        costPriceOptional: 'سعر التكلفة',
        costPricePlaceholder: 'ما دفعته للمورد',
        unitRequired: 'الوحدة *',
        newUnitButton: '+ جديد',
        newUnitPlaceholder: 'مثال: كرتونة',
        quantityLabel: 'الكمية الأولية',
        unitAdded: 'تم إضافة الوحدة',
        unitAddFailed: 'فشل في حفظ الوحدة',
        quantityInvalid: 'الكمية يجب أن تكون 1 على الأقل',
    },

    customer: {
        stepLabel: 'الخطوة 4 من 5 · اختياري',
        title: 'أضف أول عميل',
        subtitle: 'سجّل أول عملائك — يمكنك إضافة المزيد لاحقاً.',
        nameRequired: 'الاسم *',
        namePlaceholder: 'مثال: محمد أحمد',
        phoneRequired: 'رقم الهاتف *',
        phonePlaceholder: '01xxxxxxxxx',
        priceTierLabel: 'فئة السعر',
    },

    team: {
        stepLabel: 'الخطوة 5 من 5 · اختياري',
        title: 'أضف موظفاً',
        subtitle: 'امنح أحد موظفيك صلاحية الدخول لإدارة المتجر معك.',
        nameRequired: 'الاسم *',
        namePlaceholder: 'مثال: أحمد محمد',
        emailRequired: 'البريد الإلكتروني *',
        emailPlaceholder: 'ahmed@example.com',
        passwordRequired: 'كلمة المرور *',
        passwordPlaceholder: '8 أحرف على الأقل',
        roleLabel: 'الدور الوظيفي',
    },

    done: {
        title: 'جاهز للانطلاق! 🎉',
        subtitle: 'متجرك جاهز الآن. ابدأ بتسجيل أول طلب وتتبع مبيعاتك من لوحة التحكم.',
    },

    nav: {
        skip: 'تخطي',
        pleaseWait: 'يرجى الانتظار...',
        buttons: {
            start: 'ابدأ الآن',
            createStore: 'إنشاء المتجر',
            createWarehouse: 'إنشاء المخزن',
            addProduct: 'إضافة المنتج',
            addCustomer: 'إضافة العميل',
            addStaff: 'إضافة الموظف',
            goToDashboard: 'الذهاب للوحة التحكم',
            next: 'التالي',
        },
    },

    genericError: 'حدث خطأ، يرجى المحاولة مرة أخرى',
}
