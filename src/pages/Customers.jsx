import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import StatBoxes from '../components/StatBoxes'
import {useToast} from '../hooks/useToast'
import DeleteModal from '../components/DeleteModal'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, formatNumber } from '../lib/format'

export default function Customers() {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [stats, setStats] = useState(null)
    const navigate = useNavigate()
    const {showToast} = useToast()
    const { t, lang, dir } = useTranslation()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const fetchCustomers = () => {
        api.get('/customers', { params: { page, search } })
            .then(res => {
                setCustomers(res.data.data)
                setLastPage(res.data.meta.last_page)
                setStats(res.data.stats)
            })
            .catch(() => {
                showToast(t('customers.loadFailed'), 'error')
                setCustomers([])
                setStats(null)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchCustomers() }, [page, search])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/customers/${deleteTarget.id}`)
            showToast(t('customers.deleted'), 'success')
            setDeleteTarget(null)
            fetchCustomers()
        } catch (err) {
            showToast(err.response?.data?.message || t('customers.deleteFailed'), 'error')
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

    if (loading) return <LoadingSpinner />

    return (
        <div>
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <h2 className="text-xl sm:text-2xl font-bold text-white">{t('customers.title')}</h2>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('search.customer.placeholder')}
        />
        {user.role !== 'store_staff' && (
            <button
                onClick={() => navigate('/customers/create')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
                {t('customers.addCustomer')}
            </button>
        )}
    </div>
</div>

            {
                stats && (
                    <StatBoxes stats={[
                        { label: t('customers.totalCustomers'), value: formatNumber(stats.total_customers), color: 'white' },
                        { label: t('customers.totalOutstanding'), value: formatCurrency(stats.total_outstanding, lang), color: 'red'},
                    ]} />
                )
            }

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['common.code', 'common.name', 'common.phone', 'common.address', 'common.area', 'customers.priceTier', 'common.actions'].map(key => (
                                <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {t(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {customers.map(customer => (
                            <tr
                                key={customer.id}
                                onClick={() => navigate(`/customers/${customer.id}/balance`)}
                                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                            >
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {customer.code}
                                </td>
                                <td className="px-4 py-3 text-white text-sm font-medium">
                                    {customer.name}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {customer.phone}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {customer.address || '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {customer.area || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        !customer.price_tier || customer.price_tier === 'default'
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {t(`enums.priceTier.${customer.price_tier || 'default'}`)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        {user.role !== 'store_staff' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigate(`/customers/${customer.id}/edit`)
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
                                                    setDeleteTarget(customer)
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

                {customers.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {search ? t('customers.noResultsFor', { query: search }) : t('customers.empty')}
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
            title={t('customers.deleteCustomer')}
            name={deleteTarget?.name}
            warning={t('customers.deleteWarning')}
           />
        </div>
    )
}