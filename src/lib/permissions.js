// Mirrors the server's view-cost-data and view-reports gates.
export function canViewCostData(user) {
    return user?.role === 'tenant_admin'
}

export function canViewReports(user) {
    return user?.role === 'tenant_admin'
}

// Mirrors StockTransferPolicy::create — the server also checks the source store.
export function canTransferStock(user) {
    return user?.role === 'tenant_admin' || user?.role === 'store_manager'
}
