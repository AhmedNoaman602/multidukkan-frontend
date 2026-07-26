import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import StatBoxes from '../components/StatBoxes'
import DeleteModal from '../components/DeleteModal'
import ExpenseModal from '../components/ExpenseModal'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { EXPENSE_CATEGORIES } from '../lib/enums'
import { formatCurrency, formatDate } from '../lib/format'

export default function Expenses() {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [totalAmount, setTotalAmount] = useState(0)
    const [stores, setStores] = useState([])

    const [category, setCategory] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [storeId, setStoreId] = useState('')

    const [modalOpen, setModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const { showToast } = useToast()
    const { t, lang, dir } = useTranslation()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const isAdmin = user.role === 'tenant_admin'
    const canManage = user.role === 'tenant_admin' || user.role === 'store_manager'

    const fetchExpenses = () => {
        setLoading(true)
        setError(false)
        api.get('/expenses', {
            params: {
                page,
                category: category || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                store_id: isAdmin ? (storeId || undefined) : undefined,
            },
        })
            .then(res => {
                setExpenses(res.data.data)
                setLastPage(res.data.meta.last_page)
                setTotalAmount(res.data.stats?.total_amount ?? 0)
            })
            .catch(() => {
                setError(true)
                showToast(t('expenses.loadFailed'), 'error')
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchExpenses() }, [page, category, dateFrom, dateTo, storeId])

    useEffect(() => {
        if (!isAdmin) return
        api.get('/stores').then(res => setStores(res.data.data)).catch(() => {})
    }, [])

    const canManageExpense = (expense) =>
        user.role === 'tenant_admin' ||
        (user.role === 'store_manager' && expense.creator?.id === user.id)

    const openCreate = () => {
        setEditingExpense(null)
        setModalOpen(true)
    }

    const openEdit = (expense) => {
        setEditingExpense(expense)
        setModalOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await api.delete(`/expenses/${deleteTarget.id}`)
            setDeleteTarget(null)
            fetchExpenses()
            showToast(t('expenses.deleted'), 'success')
        } catch (err) {
            showToast(err.response?.data?.message || t('expenses.deleteFailed'), 'error')
            setDeleteTarget(null)
        } finally {
            setDeleting(false)
        }
    }

    const resetFilters = () => {
        setCategory('')
        setDateFrom('')
        setDateTo('')
        setStoreId('')
        setPage(1)
    }

    // Pagination arrows are physical, so they have to follow the reading
    // direction rather than being baked into the translated label.
    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    if (loading && expenses.length === 0) return <LoadingSpinner />

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">{t('expenses.title')}</h2>
                {canManage && (
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        + {t('expenses.addExpense')}
                    </button>
                )}
            </div>

            <StatBoxes stats={[
                { label: t('expenses.totalExpenses'), value: formatCurrency(totalAmount, lang), color: 'red' },
            ]} />

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <select
                    value={category}
                    onChange={e => { setCategory(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                    <option value="">{t('expenses.allCategories')}</option>
                    {EXPENSE_CATEGORIES.map(value => (
                        <option key={value} value={value}>{t(`enums.expenseCategory.${value}`)}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={dateFrom}
                    onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-500 text-sm hidden sm:inline">{t('common.to')}</span>
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => { setDateTo(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />

                {isAdmin && (
                    <select
                        value={storeId}
                        onChange={e => { setStoreId(e.target.value); setPage(1) }}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="">{t('common.allStores')}</option>
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                )}

                {(category || dateFrom || dateTo || storeId) && (
                    <button
                        onClick={resetFilters}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {t('common.clearFilters')}
                    </button>
                )}
            </div>

            {error ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500">
                    {t('expenses.loadFailedRetry')}
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                {[
                                    'common.date',
                                    'expenses.category',
                                    'common.description',
                                    'common.store',
                                    'common.createdBy',
                                    'common.amount',
                                    'common.actions',
                                ].map(key => (
                                    <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {t(key)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {expenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                                        {formatDate(expense.expense_date, lang)}
                                    </td>
                                    <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">
                                        {t(`enums.expenseCategory.${expense.category}`)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">
                                        {expense.description || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                                        {expense.store?.name || t('common.allStores')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                                        {expense.creator?.name || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-red-400 text-sm font-semibold whitespace-nowrap">
                                        {formatCurrency(expense.amount, lang)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {canManageExpense(expense) && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEdit(expense)}
                                                    className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                                                >
                                                    {t('common.edit')}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(expense)}
                                                    className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                                                >
                                                    {t('common.delete')}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {expenses.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            {(category || dateFrom || dateTo || storeId)
                                ? t('expenses.emptyFiltered')
                                : t('expenses.empty')}
                        </div>
                    )}
                </div>
            )}

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
                    <span className="text-gray-400 text-sm">
                        {t('common.pageOf', { page, total: lastPage })}
                    </span>
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

            {modalOpen && (
                <ExpenseModal
                    expense={editingExpense}
                    stores={stores}
                    isAdmin={isAdmin}
                    onClose={() => setModalOpen(false)}
                    onSuccess={fetchExpenses}
                />
            )}

            <DeleteModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                deleting={deleting}
                title={t('expenses.deleteExpense')}
                name={deleteTarget
                    ? `${t(`enums.expenseCategory.${deleteTarget.category}`)} — ${formatCurrency(deleteTarget.amount, lang)}`
                    : ''}
            />
        </div>
    )
}
