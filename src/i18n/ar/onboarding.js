export default {
    welcome: {
        greeting: '👋 أهلاً بك يا',
        subtitle: 'سنساعدك في إعداد متجرك في دقيقتين. كل شيء يمكن تعديله لاحقاً.',
        checklist: {
            createStore: 'إنشاء المتجر',
            createWarehouse: 'إضافة مخزن تخزين',
            addProduct: 'إضافة منتج',
            addCustomer: 'إضافة عميل',
            addStaff: 'إضافة موظف',
        },
    },

    store: {
        stepLabel: 'الخطوة ١ من ٥',
        title: 'أنشئ متجرك الأول',
        subtitle: 'هذه هي نقطة البيع الرئيسية التي ستُسجَّل منها الطلبات.',
        nameRequired: 'اسم المتجر *',
        namePlaceholder: 'مثال: الفرع الرئيسي',
        addressPlaceholder: 'مثال: الإسكندرية',
        phoneLabel: 'رقم الهاتف',
        phonePlaceholder: '٠١xxxxxxxxx',
    },

    warehouse: {
        stepLabel: 'الخطوة ٢ من ٥ · اختياري',
        title: 'أضف مخزن تخزين',
        subtitle: 'تم إنشاء رف متجرك تلقائياً — البيع يتم منه. أضف مخزناً أو غرفة تخزين لو عندك بضاعة إضافية.',
        nameRequired: 'اسم المخزن *',
        namePlaceholder: 'مثال: المخزن الرئيسي',
        addressPlaceholder: 'مثال: المخزن الرئيسي - الإسكندرية',
    },

    product: {
        stepLabel: 'الخطوة ٣ من ٥ · اختياري',
        title: 'أضف أول منتج',
        subtitle: 'يمكنك إضافة المزيد من المنتجات لاحقاً من صفحة المنتجات.',
        nameRequired: 'اسم المنتج *',
        namePlaceholder: 'مثال: شاكوش كبير',
        skuRequired: 'كود المنتج (SKU) *',
        skuPlaceholder: 'مثال: HAM-٠٠١',
        priceRequired: 'سعر البيع *',
        costPriceOptional: 'سعر التكلفة',
        costPricePlaceholder: 'ما دفعته للمورد',
        unitRequired: 'الوحدة *',
        newUnitButton: '+ جديد',
        newUnitPlaceholder: 'مثال: كرتونة',
        unitAdded: 'تم إضافة الوحدة',
        unitAddFailed: 'فشل في حفظ الوحدة',
    },

    customer: {
        stepLabel: 'الخطوة ٤ من ٥ · اختياري',
        title: 'أضف أول عميل',
        subtitle: 'سجّل أول عملائك — يمكنك إضافة المزيد لاحقاً.',
        nameRequired: 'الاسم *',
        namePlaceholder: 'مثال: محمد أحمد',
        phoneRequired: 'رقم الهاتف *',
        phonePlaceholder: '٠١xxxxxxxxx',
        priceTierLabel: 'فئة السعر',
    },

    team: {
        stepLabel: 'الخطوة ٥ من ٥ · اختياري',
        title: 'أضف موظفاً',
        subtitle: 'امنح أحد موظفيك صلاحية الدخول لإدارة المتجر معك.',
        nameRequired: 'الاسم *',
        namePlaceholder: 'مثال: أحمد محمد',
        emailRequired: 'البريد الإلكتروني *',
        emailPlaceholder: 'ahmed@example.com',
        passwordRequired: 'كلمة المرور *',
        passwordPlaceholder: '٨ أحرف على الأقل',
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
