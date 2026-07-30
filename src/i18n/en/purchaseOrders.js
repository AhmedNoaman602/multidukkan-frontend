// Heavily reuses common.* and orders.* — purchase orders share almost all of
// their vocabulary with sales orders (filter modes, pay modal, tooltip,
// pagination). Only genuinely PO-specific strings live here.
export default {
    title: 'Purchase Orders',
    newOrder: '+ New Purchase Order',
    totalOrders: 'Total orders',
    totalSpent: 'Total spent',
    itemsCount: 'Items: {count}',
    empty: 'No purchase orders yet.',
    emptyFiltered: 'No orders match these filters.',
    loadFailed: 'Something went wrong loading purchase orders.',

    create: {
        title: 'Create New Purchase Order',
        backToOrders: 'Back to purchase orders',
        orderDate: 'Purchase order date',
        supplierChanged: '⚠️ The supplier changed — prices below may be outdated. Remove the item and re-add it to refresh the price.',
        creating: 'Creating…',
        submit: 'Create order',
        itemRequired: 'Add at least one item.',
        storeRequired: 'Please choose a store.',
        createFailed: 'Something went wrong creating the order.',
    },

    detail: {
        cancelOrder: 'Cancel order',
        loadFailed: 'Something went wrong loading the purchase order.',
        cancelFailed: 'Something went wrong cancelling the order.',
        orderItems: 'Order items',
        cancelConfirmTitle: 'Cancel this purchase order?',
        cancelConfirmWarning: 'This will reverse the ledger entry on the supplier account and deduct from inventory. This cannot be undone.',
        keepOrder: 'Keep order',
        cancelling: 'Cancelling…',
        yesCancel: 'Yes, cancel',
    },
}
