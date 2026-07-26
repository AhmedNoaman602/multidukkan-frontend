export default {
    greetingWithName: 'Good day, {name}',
    intro: 'Welcome back! Here is a quick look at how your store is doing today.',

    // Used by the greeting helpers, currently disabled in the JSX.
    greetings: {
        friday: 'Have a blessed Friday,',
        lateNight: 'Still up?',
        earlyMorning: 'Good morning,',
        morning: 'Good morning,',
        midday: 'Good day,',
        evening: 'Good evening,',
        night: 'Good evening,',
    },

    sub: {
        greatRevenue: '🔥 Great day so far! You have made {amount} in sales.',
        unpaidOrders: '⚠️ You have {count} unpaid orders that need following up.',
        lowStock: '📦 {count} products are running low and need restocking.',
        noOrders: '🚀 No orders logged yet today — here is to a good one.',
        default: 'Here is a summary of activity at {business} today.',
    },

    periods: {
        Today: 'Today',
        Week: 'Week',
        Month: 'Month',
        Year: 'Year',
    },

    sections: {
        today: 'Today',
        overview: 'Overview',
        quickActions: 'Quick actions',
        aiInsights: 'Smart insights',
    },

    stats: {
        revenue: 'Revenue collected',
        payments: 'Payments: {count}',
        noSalesYet: 'No sales yet',
        newOrders: 'New orders',
        sales: 'Sales: {amount}',
        noOrdersYet: 'No orders yet',
        unpaidOrders: 'Unpaid orders',
        needsFollowUp: 'Needs following up',
        allSettled: 'All settled ✓',
        totalOwed: 'Total owed',
        acrossAllCustomers: 'Across all customers',
        noDues: 'Nothing outstanding 🎉',
        totalCustomers: 'Total customers',
        addFirstCustomer: 'Add your first customer',
        totalProducts: 'Total products',
        addFirstProduct: 'Add your first product',
        lowStockAlert: 'Low stock alerts',
        tapToReview: 'Tap to review',
        stockHealthy: 'Stock looks good ✓',
    },

    actions: {
        newOrder: 'New order',
        addCustomer: 'Add customer',
        addProduct: 'Add product',
        viewReports: 'View reports',
        quickSale: 'Quick sale',
    },

    ai: {
        last30Days: 'Last 30 days',
        updated: '✓ Up to date',
        analyzing: 'Analyzing…',
        refresh: '🔄 Refresh',
        analyzeSales: '✨ Analyze sales',
        emptyTitle: 'Smart analysis of your sales',
        emptyBody: 'Tap "Analyze sales" for insights tailored to your store.',
        analyzeNow: '✨ Analyze sales now',
        loading: 'Analyzing sales data…',
        loadingHint: 'This may take a few seconds.',
        noData: 'Not enough data yet',
        footer: 'Analyzed by AI',
        refreshAnalysis: '🔄 Refresh analysis',
        cards: {
            opportunity: 'Opportunity',
            urgent: 'Urgent',
            trend: 'Trend',
        },
    },

    recentOrders: {
        title: 'Recent orders',
        subtitle: 'Orders: {count} · today and newer',
        empty: 'No orders yet',
        createFirst: 'Create your first order',
        columns: {
            invoice: 'Invoice',
            items: 'Items',
        },
    },

    panel: {
        topDebtors: 'Largest balances',
        lowStock: 'Products running low',
        unpaidOrdersCount: 'Unpaid orders: {count}',
        left: '{count} left',
        threshold: 'Threshold: {count}',
        allGood: 'All clear!',
        allGoodSub: 'No outstanding balances and no low stock.',
    },

    loadFailed: 'Something went wrong loading the dashboard.',
}
