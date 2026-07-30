export default {
    welcome: {
        greeting: '👋 Welcome,',
        subtitle: "We'll help you set up your store in two minutes. Everything can be edited later.",
        checklist: {
            createStore: 'Create your store',
            createWarehouse: 'Create your warehouse',
            addProduct: 'Add a product',
            addCustomer: 'Add a customer',
            addStaff: 'Add a staff member',
        },
    },

    store: {
        stepLabel: 'Step 1 of 5',
        title: 'Create your first store',
        subtitle: 'This is the main point of sale where orders will be recorded.',
        nameRequired: 'Store name *',
        namePlaceholder: 'e.g. Main Branch',
        addressPlaceholder: 'e.g. Alexandria',
        phoneLabel: 'Phone number',
        phonePlaceholder: '01xxxxxxxxx',
    },

    warehouse: {
        stepLabel: 'Step 2 of 5',
        title: 'Create your first warehouse',
        subtitle: "Where you'll track inventory — you can add more warehouses later.",
        nameRequired: 'Warehouse name *',
        namePlaceholder: 'e.g. Main Warehouse',
        addressPlaceholder: 'e.g. Main Warehouse - Alexandria',
    },

    product: {
        stepLabel: 'Step 3 of 5 · Optional',
        title: 'Add your first product',
        subtitle: 'You can add more products later from the Products page.',
        nameRequired: 'Product name *',
        namePlaceholder: 'e.g. Large Hammer',
        skuRequired: 'Product code (SKU) *',
        skuPlaceholder: 'e.g. HAM-001',
        priceRequired: 'Selling price *',
        costPriceOptional: 'Cost price',
        costPricePlaceholder: 'What you paid the supplier',
        unitRequired: 'Unit *',
        newUnitButton: '+ New',
        newUnitPlaceholder: 'e.g. box',
        quantityLabel: 'Opening quantity',
        unitAdded: 'Unit added',
        unitAddFailed: 'Failed to save the unit',
        quantityInvalid: 'Quantity must be at least 1',
    },

    customer: {
        stepLabel: 'Step 4 of 5 · Optional',
        title: 'Add your first customer',
        subtitle: "Register your first customer — you can add more later.",
        nameRequired: 'Name *',
        namePlaceholder: 'e.g. Mohamed Ahmed',
        phoneRequired: 'Phone number *',
        phonePlaceholder: '01xxxxxxxxx',
        priceTierLabel: 'Price tier',
    },

    team: {
        stepLabel: 'Step 5 of 5 · Optional',
        title: 'Add a staff member',
        subtitle: 'Give one of your staff access to help manage the store.',
        nameRequired: 'Name *',
        namePlaceholder: 'e.g. Ahmed Mohamed',
        emailRequired: 'Email *',
        emailPlaceholder: 'ahmed@example.com',
        passwordRequired: 'Password *',
        passwordPlaceholder: 'At least 8 characters',
        roleLabel: 'Job role',
    },

    done: {
        title: 'Ready to launch! 🎉',
        subtitle: 'Your store is ready now. Start by recording your first order and tracking your sales from the dashboard.',
    },

    nav: {
        skip: 'Skip',
        pleaseWait: 'Please wait…',
        buttons: {
            start: 'Get Started',
            createStore: 'Create Store',
            createWarehouse: 'Create Warehouse',
            addProduct: 'Add Product',
            addCustomer: 'Add Customer',
            addStaff: 'Add Staff',
            goToDashboard: 'Go to Dashboard',
            next: 'Next',
        },
    },

    genericError: 'Something went wrong, please try again.',
}
