import { useEffect, useState } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'
import StatBoxes from '../components/StatBoxes'
import {useToast} from '../hooks/useToast'
import DeleteModal from '../components/DeleteModal'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, formatNumber } from '../lib/format'

export default function Suppliers() {
    const [search, setSearch] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const {showToast} = useToast()
    const { t, lang, dir } = useTranslation()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const queryClient = useQueryClient()

    const { data, isLoading, isError } = useQuery({
        queryKey: ['suppliers', { page, search }],
        queryFn: () => api.get('/suppliers', { params: { page, search } }).then(res => res.data),
        placeholderData: keepPreviousData,
    })

    useEffect(() => {
        if (isError) showToast(t('suppliers.loadFailed'), 'error')
    }, [isError, showToast, t])

    const suppliers = data?.data || []
    const lastPage = data?.meta?.last_page || 1
    const stats = data?.stats || []

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/suppliers/${deleteTarget.id}`)
            setDeleteTarget(null)
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
            showToast(t('suppliers.deleted'), 'success')
        } catch (err) {
            showToast(err.response?.data?.message || t('suppliers.deleteFailed'), 'error')
            setDeleteTarget(null)
        } finally {
            setDeleting(false)
        }
    }

    const handleSearch = (value) => {
        setSearch(value)
        setPage(1)
    }

    // Pagination arrows are physical, so they have to follow the reading
    // direction rather than being baked into the translated label.
    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    if (isLoading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">{t('suppliers.title')}</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <SearchInput
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder={t('search.supplier.placeholder')}
                    />
                    {user.role !== 'store_staff' && (
                        <button
                            onClick={() => navigate('/suppliers/create')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {t('suppliers.addSupplier')}
                        </button>
                    )}
                </div>
            </div>

            {
                stats && (
                    <StatBoxes stats={[
                        { label: t('suppliers.totalSuppliers'), value: formatNumber(stats.total_suppliers), color: 'white' },
                        { label: t('suppliers.totalOwed'), value: formatCurrency(stats.total_owed, lang), color: 'red' },
                    ]} />
                )
            }

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['common.code', 'common.name', 'common.phone', 'common.address', 'common.area', 'common.actions'].map(key => (
                                <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {t(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {suppliers.map(supplier => (
                            <tr
                                key={supplier.id}
                                onClick={() => navigate(`/suppliers/${supplier.id}/balance`)}
                                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                            >
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {supplier.code}
                                </td>
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {supplier.name}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {supplier.phone}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {supplier.address || '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {supplier.area || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        {user.role !== 'store_staff' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/suppliers/${supplier.id}/edit`)
                                                }}
                                                className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                                            >
                                                {t('common.edit')}
                                            </button>
                                        )}
                                        {user.role === 'tenant_admin' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                     console.log('delete clicked', supplier.id)
                                                    setDeleteTarget(supplier)
                                                }}
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

                {suppliers.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search ? t('suppliers.noResultsFor', { query: search }) : t('suppliers.empty')}
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
    title={t('suppliers.deleteSupplier')}
    name={deleteTarget?.name}
/>
        </div>
    )
}