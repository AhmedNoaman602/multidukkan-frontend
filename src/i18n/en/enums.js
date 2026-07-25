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
