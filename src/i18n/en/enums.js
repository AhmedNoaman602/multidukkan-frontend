// Display labels for backend enum values. The KEYS are the raw values the API
// sends and are part of the API contract — never translate or rename a key,
// only the string a user sees.

export default {
    role: {
        tenant_admin: 'Store Owner',
        store_manager: 'Store Manager',
        store_staff: 'Staff',
    },

    paymentMethod: {
        cash: 'Cash',
        bank_transfer: 'Bank Transfer',
        instapay: 'InstaPay',
        vodafone_cash: 'Vodafone Cash',
        orange_cash: 'Orange Cash',
        check: 'Cheque',
    },

    // Which reference field to ask for, per payment method.
    paymentReference: {
        bank_transfer: 'Transfer Number',
        instapay: 'Transaction Number',
        vodafone_cash: 'Sender Number',
        orange_cash: 'Sender Number',
        check: 'Cheque Number',
    },

    orderStatus: {
        paid: 'Paid',
        unpaid: 'Unpaid',
    },

    // Customer pricing tier. Used both as the customer's selected-tier badge
    // and as the label on the matching price input in the product form.
    priceTier: {
        default: 'Default',
        a: 'Price A',
        b: 'Price B',
        c: 'Price C',
        d: 'Price D',
        e: 'Price E',
    },

    // Audit-log `type` is a union across three sources (ledger / inventory /
    // audit), so these keys mirror typeStyles in lib/auditLog.js exactly.
    auditType: {
        ORDER_CHARGE: 'Order Charge',
        PAYMENT: 'Payment',
        REVERSAL: 'Reversal',
        CREDIT_APPLY: 'Credit Added',
        CREDIT_CONSUMED: 'Credit Used',
        REFUND: 'Refund',
        PURCHASE_CHARGE: 'Purchase Charge',
        PURCHASE_REVERSAL: 'Purchase Reversal',
        SUPPLIER_PAYMENT: 'Supplier Payment',
        SUPPLIER_PAYMENT_REVERSAL: 'Supplier Payment Reversal',
        SALE: 'Sale',
        RETURN: 'Stock Return',
        TRANSFER_IN: 'Transfer In',
        TRANSFER_OUT: 'Transfer Out',
        ADJUSTMENT_IN: 'Adjustment In',
        ADJUSTMENT_OUT: 'Adjustment Out',
        PURCHASE_IN: 'Purchase In',
        PURCHASE_OUT: 'Purchase Out',
        created: 'Created',
        updated: 'Updated',
        deleted: 'Deleted',
    },

    // The API sends class_basename(), so these are short model names.
    auditEntity: {
        Product: 'Product',
        Customer: 'Customer',
        Supplier: 'Supplier',
        Store: 'Store',
        Order: 'Order',
        PurchaseOrder: 'Purchase Order',
        Expense: 'Expense',
    },

    // Keys match Expense::CATEGORIES on the backend exactly.
    expenseCategory: {
        SALARIES: 'Salaries',
        RENT: 'Rent',
        UTILITIES: 'Utilities',
        TRANSPORTATION: 'Transportation',
        INTERNET: 'Internet',
        MAINTENANCE: 'Maintenance',
        SUPPLIES: 'Supplies',
        MISCELLANEOUS: 'Miscellaneous',
    },
}
