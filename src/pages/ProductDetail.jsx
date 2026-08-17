import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, formatDate } from '../lib/format'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t, lang } = useTranslation()

    const { data: product, isLoading } = useQuery({
        queryKey: ['products', id],
        queryFn: () => api.get(`/products/${id}`).then(res => res.data.data),
    })

    const { data: suppliers = [] } = useQuery({
        queryKey: ['products', id, 'suppliers'],
        queryFn: () => api.get(`/products/${id}/suppliers`).then(res => res.data.data),
    })

    if (isLoading) return <LoadingSpinner />
    if (!product) return <div className="text-red-400">{t('products.detail.notFound')}</div>

    const totalStock = product.stocks?.reduce((sum, s) => sum + s.quantity, 0) ?? 0

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <BackButton label={t('products.create.backToProducts')} to="/products" />
                <button
                    onClick={() => navigate(`/products/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    {t('products.edit.title')}
                </button>
            </div>

            {/* Basic Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                        <p className="text-gray-400 text-sm mt-1">{t('search.product.skuLabel', { sku: product.sku })}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        totalStock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                        {totalStock > 0 ? t('products.detail.inStock', { count: totalStock }) : t('products.detail.outOfStock')}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('products.defaultPrice')}</p>
                        <p className="text-white text-lg font-semibold">{formatCurrency(product.price, lang)}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('products.costPrice')}</p>
                        <p className="text-white text-lg font-semibold">
                            {product.cost_price ? formatCurrency(product.cost_price, lang) : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('products.profitMargin')}</p>
                        <p className="text-blue-400 text-lg font-semibold">
                            {product.profit_margin ? `${product.profit_margin}%` : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('products.form.unit')}</p>
                        <p className="text-white text-sm">{product.unit}</p>
                    </div>
                    {product.secondary_unit && (
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t('products.form.secondaryUnit')}</p>
                            <p className="text-white text-sm">
                                {t('products.form.conversionPreview', {
                                    secondary: product.secondary_unit,
                                    factor: product.conversion_factor,
                                    base: product.unit,
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Price Tiers */}
            {['a', 'b', 'c', 'd', 'e'].some(tier => product[`price_${tier}`]) && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{t('products.form.priceTiers')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {['a', 'b', 'c', 'd', 'e'].map(tier => (
                            <div key={tier}>
                                <p className="text-gray-500 text-xs mb-1">{t(`enums.priceTier.${tier}`)}</p>
                                <p className="text-white text-sm font-medium">
                                    {product[`price_${tier}`] ? formatCurrency(product[`price_${tier}`], lang) : '—'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warehouse Stock */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-4">
                <div className="px-4 py-3 border-b border-gray-800">
                    <h3 className="text-white font-semibold text-sm">{t('products.form.warehouseStock')}</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['common.warehouse', 'common.quantity', 'products.form.threshold'].map(key => (
                                <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{t(key)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {product.stocks?.map(s => (
                            <tr key={s.warehouse_id} className="hover:bg-gray-800/50">
                                <td className="px-4 py-3 text-white text-sm">{s.warehouse_name}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        s.quantity > s.threshold
                                            ? 'bg-green-500/20 text-green-400'
                                            : s.quantity > 0
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {s.quantity} {product.unit}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{s.threshold}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!product.stocks || product.stocks.length === 0) && (
                    <div className="text-center py-8 text-gray-500 text-sm">{t('products.detail.noStockData')}</div>
                )}
            </div>

            {/* Suppliers */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-4">
                <div className="px-4 py-3 border-b border-gray-800">
                    <h3 className="text-white font-semibold text-sm">{t('suppliers.title')}</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['common.supplier', 'products.costPrice', 'products.detail.lastPurchase', 'products.detail.preferred'].map(key => (
                                <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{t(key)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {suppliers.map(s => (
                            <tr key={s.id} className="hover:bg-gray-800/50">
                                <td className="px-4 py-3 text-white text-sm">{s.name}</td>
                                <td className="px-4 py-3 text-white text-sm">
                                    {s.cost_price ?? s.last_purchase_price ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{s.last_purchased_at ? formatDate(s.last_purchased_at, lang) : '—'}</td>
                                <td className="px-4 py-3 text-sm">{s.is_preferred ? '⭐' : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {suppliers.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">{t('products.detail.noSuppliersLinked')}</div>
                )}
            </div>
        </div>
    )
}
