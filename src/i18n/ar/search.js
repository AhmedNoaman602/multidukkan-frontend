// مشتركة بين ProductSearchInput وCustomerSearchInput — مكونات بحث قابلة
// لإعادة الاستخدام، متركبة في صفحات لسه ماتترجمتش (SupplierBalance،
// CreatePurchaseOrder، QuickSaleModal، AddItemModal)، فتصليح النص جوه
// المكونات دي آمن بغض النظر عن حالة ترجمة الصفحة اللي بتستخدمها.
export default {
    browse: 'تصفح',

    product: {
        placeholder: 'ابحث بالاسم أو رمز المنتج...',
        browseTitle: 'تصفح المنتجات',
        skuLabel: 'رمز المنتج: {sku}',
        countLabel: 'المنتجات: {count}',
        noResults: 'مفيش منتجات بـ "{query}"',
        noResultsBrowse: 'مفيش منتجات.',
    },

    customer: {
        placeholder: 'ابحث بالاسم أو التليفون أو الكود...',
        browseTitle: 'تصفح العملاء',
        countLabel: 'العملاء: {count}',
        noResults: 'مفيش عملاء بـ "{query}"',
        noResultsBrowse: 'مفيش عملاء.',
    },

    supplier: {
        placeholder: 'ابحث بالاسم أو التليفون أو الكود...',
        browseTitle: 'تصفح الموردين',
        countLabel: 'الموردين: {count}',
        noResults: 'مفيش موردين بـ "{query}"',
        noResultsBrowse: 'مفيش موردين.',
    },
}
