import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import {useToast} from '../hooks/useToast'
import DeleteModal from '../components/DeleteModal'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency } from '../lib/format'

export default function Products() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [deleteTarget , setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [page , setPage] = useState(1)
    const {showToast} = useToast()
    const { t, lang, dir } = useTranslation()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const queryClient = useQueryClient()

    const { data, isLoading, isError } = useQuery({
        queryKey: ['products', { page, search }],
        queryFn: () => api.get('/products', { params: { page, search } }).then(res => res.data),
        placeholderData: keepPreviousData,
    })

    useEffect(() => {
        if (isError) showToast(t('products.loadFailed'), 'error')
    }, [isError, showToast, t])

    const products = data?.data || []
    const lastPage = data?.meta?.last_page || 1

    const handleSearch = (value) => {
        setSearch(value)
        setPage(1)
    }

    const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
        await api.delete(`/products/${deleteTarget.id}`)
        setDeleteTarget(null)
        queryClient.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
        showToast(err.response?.data?.message || t('products.deleteFailed'), 'error')
        setDeleteTarget(null)
    } finally {
        setDeleting(false)
    }
}

    // Pagination arrows are physical, so they have to follow the reading
    // direction rather than being baked into the translated label.
    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    if (isLoading) return <LoadingSpinner />

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">{t('products.title')}</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={t('search.product.placeholder')}
                    />
                    {user.role === 'tenant_admin' && (
                        <button
                            onClick={() => navigate('/products/create')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {t('products.addProduct')}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {[
                                'common.name', 'common.code', 'products.defaultPrice',
                                'enums.priceTier.a', 'enums.priceTier.b', 'enums.priceTier.c', 'enums.priceTier.d', 'enums.priceTier.e',
                                'products.costPrice', 'products.profitMargin', 'common.warehouse', 'common.actions',
                            ].map(key => (
                                <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {t(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {products.map(product => (
                            <tr key={product.id} onClick={() => navigate(`/products/${product.id}`)} className="hover:bg-gray-800/50 transition-colors cursor-pointer">
                                <td className="px-4 py-3 text-white text-sm">{product.name}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{product.sku}</td>
                                <td className="px-4 py-3 text-white text-sm">{formatCurrency(product.price, lang)}</td>
                               {['a', 'b', 'c', 'd', 'e'].map(tier => (
    <td key={tier} className="px-4 py-3 text-sm">
        <div className="text-gray-300">
            {product[`price_${tier}`] ?? '—'}
        </div>
        {product[`price_${tier}`] && product[`profit_margin_${tier}`] !== null && (
            <div className={`text-xs ${
                product[`profit_margin_${tier}`] >= 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
            }`}>
                {product[`profit_margin_${tier}`]}%
            </div>
        )}
    </td>
))}
                              
    <td className='px-4 py-3 text-white text-sm'>
    {product.cost_price ? formatCurrency(product.cost_price, lang) : '—'}
    </td>

    <td className={`px-4 py-3 text-sm font-medium ${
    product.profit_margin === null ? 'text-gray-500' :
    product.profit_margin >= 0 ? 'text-green-400' : 'text-red-400'
    }`}>
    {product.profit_margin !== null ? `${product.profit_margin}%` : '—'}
</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{product.unit}</td>
                                <td className="px-4 py-3">
    <div className="flex gap-2">
        {user.role === 'tenant_admin' && (
            <button
    onClick={(e) => { e.stopPropagation(); navigate('/products/create', { state: { duplicate: product } }) }}
    className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-500/20 transition-colors"
>
    {t('products.duplicate')}
</button>
        )}
        {user.role === 'tenant_admin' && (
            <button
    onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}/edit`) }}
                className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
            >
                {t('common.edit')}
            </button>
        )}
        {user.role === 'tenant_admin' && (
            <button
    onClick={(e) => { e.stopPropagation(); setDeleteTarget(product) }}
                className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors"
            >
                {t('common.delete')}
            </button>
        )}
    </div>
</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search ? t('products.noResultsFor', { query: search }) : t('products.empty')}
                    </div>
                )}
            </div>
            {lastPage > 1 && (
    <div className="flex justify-between items-center mt-4">
        <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
        >
            <PrevIcon size={16} />
            {t('common.previous')}
        </button>
        <span className="text-gray-400 text-sm">{t('common.pageOf', { page, total: lastPage })}</span>
        <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === lastPage}
            className="flex items-center gap-1 px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
        >
            {t('common.next')}
            <NextIcon size={16} />
        </button>
    </div>
)}
            <DeleteModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                deleting={deleting}
                title={t('products.deleteProduct')}
                name={deleteTarget?.name}
            />
        </div>
    )
}