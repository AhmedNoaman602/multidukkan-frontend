// Shared UI vocabulary. Anything used by more than one feature lives here —
// never duplicate a string into a feature namespace.

export default {
    // Buttons / actions
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    deleting: 'Deleting…',
    add: 'Add',
    close: 'Close',
    clearFilters: 'Clear filters',

    // Delete confirmation modal (see components/DeleteModal.jsx)
    deleteItem: 'Delete item',
    confirmDelete: 'Are you sure you want to delete {name}? This action cannot be undone.',
    yesDelete: 'Yes, delete',

    back: 'Back',
    from: 'From',
    search: 'Search…',
    invoice: 'Invoice',
    items: 'Items',
    quickSale: 'Quick sale',
    paymentsCount: 'Payments: {count}',

    // Filters
    to: 'to',
    allStores: 'All stores',

    // Table / list states
    actions: 'Actions',
    date: 'Date',
    time: 'Time',
    store: 'Store',
    amount: 'Amount',
    total: 'Total',
    remaining: 'Remaining',
    status: 'Status',
    customer: 'Customer',
    supplier: 'Supplier',
    createdBy: 'Created by',
    description: 'Description',
    notes: 'Notes',
    optional: 'optional',
    all: 'All',
    viewAll: 'View all',
    quantity: 'Quantity',
    product: 'Product',
    warehouse: 'Warehouse',
    name: 'Name',
    code: 'Code',
    phone: 'Phone',
    address: 'Address',
    area: 'Area',

    // Pagination
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {page} of {total}',

    // Month names, indexed 0-11 (Date().getMonth())
    months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ],

    // Formatting
    currency: 'EGP',
}
