// Mirrors the server's view-cost-data and view-reports gates.
export function canViewCostData(user) {
    return user?.role === 'tenant_admin'
}

export function canViewReports(user) {
    return user?.role === 'tenant_admin'
}
