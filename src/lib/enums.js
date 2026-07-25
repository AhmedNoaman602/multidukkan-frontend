// Canonical backend enum values, in the order they should be listed in the UI.
// These are API contract values — send them raw, and render them through
// t(`enums.<group>.${value}`). Never send a translated label to the API.

// Matches Expense::CATEGORIES on the backend.
export const EXPENSE_CATEGORIES = [
    'SALARIES',
    'RENT',
    'UTILITIES',
    'TRANSPORTATION',
    'INTERNET',
    'MAINTENANCE',
    'SUPPLIES',
    'MISCELLANEOUS',
]
