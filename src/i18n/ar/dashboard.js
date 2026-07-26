export default {
    greetingWithName: 'نهارك سعيد، {name}',
    intro: 'أهلاً بيك من تاني! دي نظرة سريعة على أداء متجرك والتحليلات بتاعة النهاردة.',

    // بتستخدمها دوال التحية، المعطلة حالياً في الـ JSX.
    greetings: {
        friday: 'جمعة مباركة،',
        lateNight: 'سهران لسه؟',
        earlyMorning: 'صباح الفل،',
        morning: 'صباح الخير،',
        midday: 'نهارك سعيد،',
        evening: 'مساء الخير،',
        night: 'مساء النور،',
    },

    sub: {
        greatRevenue: '🔥 أداء رائع اليوم! حققت مبيعات بقيمة {amount} حتى الآن',
        unpaidOrders: '⚠️ لديك {count} طلبات غير مسددة تحتاج إلى المتابعة',
        lowStock: '📦 يوجد {count} منتجات أوشكت على النفاد وتحتاج إلى إعادة التوريد',
        noOrders: '🚀 لم يتم تسجيل أي طلبات اليوم بعد، نتمنى لك يوماً ناجحاً',
        default: 'إليك ملخص نشاط {business} اليوم',
    },

    // المفاتيح هي قيم الفلتر الداخلية — متتترجمش.
    periods: {
        Today: 'اليوم',
        Week: 'الأسبوع',
        Month: 'الشهر',
        Year: 'السنة',
    },

    sections: {
        today: 'اليوم',
        overview: 'نظرة عامة',
        quickActions: 'إجراءات سريعة',
        aiInsights: 'تحليلات ذكية',
    },

    stats: {
        revenue: 'الإيرادات المحصلة',
        payments: 'الدفعات: {count}',
        noSalesYet: 'مفيش مبيعات لحد دلوقتي',
        newOrders: 'الطلبات الجديدة',
        sales: 'المبيعات: {amount}',
        noOrdersYet: 'مفيش طلبات لحد دلوقتي',
        unpaidOrders: 'الطلبات غير المدفوعة',
        needsFollowUp: 'محتاجة متابعة',
        allSettled: 'كله متسدد ✓',
        totalOwed: 'إجمالي المستحقات',
        acrossAllCustomers: 'على كل العملاء',
        noDues: 'مفيش مستحقات 🎉',
        totalCustomers: 'إجمالي العملاء',
        addFirstCustomer: 'أضف أول عميل',
        totalProducts: 'إجمالي المنتجات',
        addFirstProduct: 'أضف أول منتج',
        lowStockAlert: 'تنبيه نقص المخزون',
        tapToReview: 'اضغط للمراجعة',
        stockHealthy: 'المخزون كويس ✓',
    },

    actions: {
        newOrder: 'طلب جديد',
        addCustomer: 'إضافة عميل',
        addProduct: 'إضافة منتج',
        viewReports: 'عرض التقارير',
        quickSale: 'بيع سريع',
    },

    ai: {
        last30Days: 'آخر 30 يوم',
        updated: '✓ محدّث',
        analyzing: 'جاري التحليل...',
        refresh: '🔄 تحديث',
        analyzeSales: '✨ تحليل المبيعات',
        emptyTitle: 'تحليل ذكي لمبيعاتك',
        emptyBody: 'اضغط على "تحليل المبيعات" للحصول على رؤى مخصصة لمتجرك',
        analyzeNow: '✨ تحليل المبيعات الآن',
        loading: 'جاري تحليل بيانات المبيعات...',
        loadingHint: 'قد يستغرق هذا بضع ثوانٍ',
        noData: 'لا توجد بيانات كافية',
        footer: 'تم التحليل بواسطة الذكاء الاصطناعي',
        refreshAnalysis: '🔄 تحديث التحليل',
        cards: {
            opportunity: 'فرصة',
            urgent: 'عاجل',
            trend: 'اتجاه',
        },
    },

    recentOrders: {
        title: 'أحدث الطلبات',
        subtitle: 'الطلبات: {count} · النهاردة والأحدث',
        empty: 'مفيش طلبات لسه',
        createFirst: 'اعمل أول طلب',
        columns: {
            invoice: 'الفاتورة',
            items: 'الأصناف',
        },
    },

    panel: {
        topDebtors: 'أكبر المديونيات',
        lowStock: 'منتجات قربت تخلص',
        unpaidOrdersCount: 'طلبات غير مدفوعة: {count}',
        left: 'متبقي {count}',
        threshold: 'الحد الأدنى: {count}',
        allGood: 'كله تمام!',
        allGoodSub: 'مفيش مديونيات ولا نقص مخزون',
    },

    loadFailed: 'حصلت مشكلة في تحميل لوحة التحكم',
}
