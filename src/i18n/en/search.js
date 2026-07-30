// Shared by ProductSearchInput and CustomerSearchInput — reusable typeahead
// components mounted on several unmigrated pages (SupplierBalance,
// CreatePurchaseOrder, QuickSaleModal, AddItemModal), so fixing the text
// inside these components is safe regardless of the calling page's
// migration status.
export default {
    browse: 'Browse',

    product: {
        placeholder: 'Search by name or product code…',
        browseTitle: 'Browse Products',
        skuLabel: 'SKU: {sku}',
        countLabel: '{count} products',
        noResults: 'No products found for "{query}"',
        noResultsBrowse: 'No products.',
    },

    customer: {
        placeholder: 'Search by name, phone, or code…',
        browseTitle: 'Browse Customers',
        countLabel: '{count} customers',
        noResults: 'No customers found for "{query}"',
        noResultsBrowse: 'No customers.',
    },

    supplier: {
        placeholder: 'Search by name, phone, or code…',
        browseTitle: 'Browse Suppliers',
        countLabel: '{count} suppliers',
        noResults: 'No suppliers found for "{query}"',
        noResultsBrowse: 'No suppliers.',
    },

    order: {
        placeholder: 'Search by invoice number…',
        browseTitle: 'Browse Orders',
        countLabel: 'Orders: {count}',
        noResults: 'No orders found for "{query}"',
        noResultsBrowse: 'No orders.',
    },

    global: {
        placeholder: 'Search customers, products, orders, and suppliers…',
        searching: 'Searching…',
        emptyHint: 'Type to search customers, products, orders, and suppliers…',
        navigateHint: '↑↓ to navigate',
        selectHint: 'Enter to select',
        closeHint: 'Esc to close',
        noResultsFor: 'No results for "{query}"',
    },
}
