import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import Modal from '../components/Modal'
import StatBoxes from '../components/StatBoxes'
import RefundModal from '../components/RefundModal'
import {useToast} from '../hooks/useToast'
import QuickSaleModal from '../components/QuickSaleModal'
import { useTranslation } from '../i18n/useTranslation'
import { formatCurrency, formatDate, formatNumber } from '../lib/format'

const PAY_METHODS = ['cash', 'bank_transfer', 'check']

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [yearFilter, setYearFilter] = useState('')
    const [payTarget, setPayTarget] = useState(null)
    const [payForm, setPayForm] = useState({ amount: '', method: 'cash' })
    const [paying, setPaying] = useState(false)
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [years, setYears] = useState([])
    const [monthFilter, setMonthFilter] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [stats, setStats] = useState(null)
    const [dateExact , setDateExact] = useState('');
    const [filterMode , setFilterMode] = useState('all')
    const [hoveredOrder, setHoveredOrder] = useState(null)
    const [tooltipPos, setTooltipPos] = useState(null)
    const hasActiveFilters = yearFilter || monthFilter || dateFrom || dateTo || dateExact || search || filterMode !== 'all'
    const [refundTarget, setRefundTarget] = useState(null)
    const [showQuickSale, setShowQuickSale] = useState(false)
    const [quickSaleProducts, setQuickSaleProducts] = useState([])
    const [quickSaleWarehouses, setQuickSaleWarehouses] = useState([])
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const [inventory, setInventory] = useState([])
    const { showToast } = useToast()
    const { t, lang, dir } = useTranslation()

const clearFilters = () => {
    setFilterMode('all')
    setYearFilter('')
    setMonthFilter('')
    setDateFrom('')
    setDateTo('')
    setDateExact('')
    setSearch('')
    setPage(1)
}
    const navigate = useNavigate()



const fetchQuickSaleData = async () => {
    if (quickSaleProducts.length > 0) return
    const [productsRes, inventoryRes, warehousesRes] = await Promise.all([
        api.get('/products?per_page=all'),
        api.get('/inventory?per_page=all'),
        api.get('/warehouses'),
    ])
    setQuickSaleProducts(productsRes.data.data)
    setInventory(inventoryRes.data.data)
    setQuickSaleWarehouses(warehousesRes.data.data)
}

    const fetchOrders = () => {
        const today = new Date().toISOString().split('T')[0]

        api.get('/orders', { params: { 
            page, 
            search, 
            year: yearFilter,
            month: monthFilter,
            date_from: dateFrom,
            date_to: dateTo,
            date_exact: filterMode === 'today' ? today : dateExact,
        } 
    })
            .then(res => {
                setOrders(res.data.data)
                setLastPage(res.data.meta.last_page)
                setYears(res.data.years)
                setStats(res.data.stats || null)
            })
            .catch(() => showToast(t('orders.list.loadFailed'), 'error'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchOrders()
    }, [page, search, yearFilter,monthFilter, dateFrom, dateTo,dateExact,filterMode])

    const handlePay = async (e) => {
        e.preventDefault()
        setPaying(true)
        try {
            await api.post('/payments', {
                order_id:    payTarget.id,
                customer_id: payTarget.customer_id,
                amount:      parseFloat(payForm.amount),
                method:      payForm.method,
            })
            showToast(t('orders.payModal.success'), 'success')
            setTimeout(() => {
                setPayTarget(null)
                setPayForm({ amount: '', method: 'cash' })
                fetchOrders()
            }, 1000)
        } catch (err) {
            showToast(err.response?.data?.message || t('orders.payModal.failed'), 'error')
        } finally {
            setPaying(false)
        }
    }

    const handleSearch = (value) => {
        setSearch(value)
        setPage(1)
    }

    // Identify the walk-in customer by id, not by display name — the name is
    // seeded data and translating it would silently break these checks.
    const isWalkIn = (order) =>
        user.walk_in_customer_id != null &&
        Number(order.customer_id) === Number(user.walk_in_customer_id)

    const getPaidAmount = (order) => {
        if (order.amount_paid != null) return Number(order.amount_paid) || 0
        const total = Number(order.total) || 0
        const remaining = Number(order.amount_remaining) || 0
        return Math.max(total - remaining, 0)
    }

    // Pagination arrows are physical, so they have to follow the reading
    // direction rather than being baked into the translated label.
    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="mb-6 space-y-3">
    {/* Top row */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">{t('orders.title')}</h2>
        <div className="flex items-center gap-2 flex-wrap">
                   <button
    onClick={async () => {
        await fetchQuickSaleData()
        setShowQuickSale(true)
    }}
    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
>
    ⚡ {t('common.quickSale')}
</button>
        <button
            onClick={() => navigate('/orders/create')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
            {t('orders.list.newOrder')}
        </button>
    </div>
</div>
{/* Filter row */}
<div className="flex items-center gap-4 flex-wrap">
    {/* Search + New Order */}
    <div className="flex items-center gap-3 me-0 sm:me-6 w-full sm:w-auto">
        <div className="w-full sm:w-80">
            <SearchInput
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('orders.list.searchPlaceholder')}
            />
        </div>
    </div>

    {/* Filter mode pills */}
    <div className="flex justify-start items-center gap-2 flex-wrap ">
        <span className="text-gray-500 text-xs uppercase tracking-wider">{t('orders.list.filterLabel')}</span>

        {['all', 'today', 'month', 'year', 'range', 'exact'].map(mode => (
            <button
                key={mode}
                type="button"
                onClick={() => {
                    setFilterMode(mode)
                    setYearFilter('')
                    setMonthFilter('')
                    setDateFrom('')
                    setDateTo('')
                    setDateExact('')
                    setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
            >
                {t(`orders.list.filterModes.${mode}`)}
            </button>
        ))}

        
    </div>

    {/* Contextual inputs based on mode */}
    {filterMode === 'year' && (
        <div className="flex items-center gap-2">
            <select
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
                <option value="">{t('orders.list.chooseYear')}</option>
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
    )}

    {filterMode === 'month' && (
        <div className="flex items-center gap-2">
            <select
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
                <option value="">{t('orders.list.chooseYear')}</option>
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
            <select
                value={monthFilter}
                onChange={(e) => { setMonthFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
                <option value="">{t('orders.list.chooseMonth')}</option>
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{t(`common.months.${i}`)}</option>
                ))}
            </select>
        </div>
    )}

    {filterMode === 'range' && (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">{t('common.from')}</span>
                <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || new Date().toISOString().split('T')[0]}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">{t('common.to')}</span>
                <input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
            </div>
        </div>
    )}

    {filterMode === 'exact' && (
        <input
            type="date"
            value={dateExact}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setDateExact(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
        />
    )}
    {hasActiveFilters && (
            <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs transition-colors"
            >
                {t('common.clearFilters')}
            </button>
        )}
</div>
</div>

            {stats && (
                <StatBoxes stats={[
                    { label: t('orders.list.totalOrders'), value: formatNumber(stats.total_orders), color: 'white'  },
                    { label: t('orders.list.totalRevenue'), value: formatCurrency(stats.total_revenue, lang), color: 'white'  },
                    { label: t('orders.list.paidAmount'), value: formatCurrency(stats.paid_amount, lang), color: 'green'  },
                    { label: t('orders.list.unpaidAmount'), value: formatCurrency(stats.unpaid_amount, lang), color: 'red'    },
                ]} />
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['common.invoice', 'common.customer', 'common.items', 'common.total', 'common.status', 'common.date', null].map(key => (
                                <th key={key ?? 'actions'} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {key ? t(key) : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {orders.map(order => (
                            <tr
                                key={order.id}
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const placement = rect.top > 180 ? 'above' : 'below'
                                    setTooltipPos({
                                        top: placement === 'above' ? rect.top : rect.bottom,
                                        left: rect.left + rect.width / 2,
                                        placement,
                                    })
                                    setHoveredOrder(order.id)
                                }}
                                onMouseLeave={() => setHoveredOrder(null)}
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                            >
                                <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                                    {order.invoice_number || `#${order.id}`}
                                </td>
                                <td className="px-4 py-3 text-white text-sm font-medium">{order.customer_name}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{order.items_count} {t('orders.list.unit')}</td>
                                <td className="px-4 py-3 text-white text-sm">{formatCurrency(order.total, lang)}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        order.status === 'paid'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {t(`enums.orderStatus.${order.status}`)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {formatDate(order.order_date ?? order.created_at, lang)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap relative">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                window.open(`/orders/${order.id}/invoice`, '_blank')
                                            }}
                                            className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                                        >
                                            {t('common.invoice')}
                                        </button>
                                        {order.status === 'unpaid' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setPayTarget(order)
                                                    setPayForm({ amount: order.amount_remaining, method: 'cash' })
                                                }}
                                                className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium rounded-lg hover:bg-purple-500/20 transition-colors"
                                            >
                                                {t('orders.list.pay')}
                                            </button>
                                        )}
                                        {order.refundable_amount > 0 && !isWalkIn(order) && (
                                         <button
                                               onClick={(e) => {
                                                    e.stopPropagation()
                                                    setRefundTarget(order)
                                               }}
                                         className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium rounded-lg hover:bg-orange-500/20 transition-colors"
                                         >
                                             {t('orders.list.refund')}
                                         </button>
                                        )}
                                        {order.refundable_amount === 0 && order.payments_count > 0 && !isWalkIn(order) && (
   <span
    title={t('orders.list.refundNotEligible')}
    className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-500 text-xs font-medium rounded-lg cursor-help"
>
    {t('orders.list.refund')} ⓘ
</span>
)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {orders.length === 0 && (
                    <div className="text-center py-16 text-gray-500">
                        {hasActiveFilters ? t('orders.list.emptyFiltered') : t('orders.list.empty')}
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

            <Modal
                open={!!payTarget}
                onClose={() => {
                    setPayTarget(null)
                    setPayForm({ amount: '', method: 'cash' })
                }}
                title={t('orders.payModal.title', { invoice: payTarget?.invoice_number })}
            >
                {payTarget && (
                    <form onSubmit={handlePay} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">{t('common.amount')}</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={payForm.amount}
                                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">{t('orders.payModal.method')}</label>
                            <select
                                value={payForm.method}
                                onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                            >
                                {PAY_METHODS.map(method => (
                                    <option key={method} value={method}>{t(`enums.paymentMethod.${method}`)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setPayTarget(null)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={paying || !payForm.amount}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {paying ? t('orders.payModal.processing') : t('orders.payModal.confirm')}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
            <RefundModal
                open={!!refundTarget}
                onClose={() => setRefundTarget(null)}
                customerId={refundTarget?.customer_id}
                orders={refundTarget ? [{
                        ...refundTarget,
                        paid: refundTarget.payments?.reduce((sum, p) => 
                            sum + (p.amount - p.refunded_amount), 0) ?? 0,
                        refundable: refundTarget.payments?.reduce((sum, p) => 
                            sum + (p.amount - p.refunded_amount), 0) ?? 0,
                    }] : []}
                payments={refundTarget?.payments ?? []}
                onSuccess={() => {
                    setRefundTarget(null)
                    fetchOrders()
                }}
/>

{showQuickSale && (
    <QuickSaleModal
        open={showQuickSale}
        onClose={() => {
            setShowQuickSale(false)
            fetchOrders()
        }}
        products={quickSaleProducts}
        warehouses={quickSaleWarehouses}
         inventory={inventory} 
        storeId={user.store_id}
    />
)}

{hoveredOrder && tooltipPos && createPortal(
    (() => {
        const order = orders.find(o => o.id === hoveredOrder)
        if (!order) return null
        return (
            <div
                className="fixed pointer-events-none z-50"
                style={{
                    top: tooltipPos.top,
                    left: tooltipPos.left,
                    transform: `translate(-50%, ${tooltipPos.placement === 'above' ? 'calc(-100% - 8px)' : '8px'})`,
                }}
            >
                <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-2xl px-4 py-3 w-[240px]">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">{t('common.total')}:</span>
                            <span className="text-white font-medium">{formatCurrency(order.total, lang)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">{t('orders.list.tooltipPaid')}</span>
                            <span className="text-green-400 font-medium">
                                {formatCurrency(getPaidAmount(order), lang)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                            <span className="text-gray-400">{t('orders.list.tooltipRemaining')}</span>
                            <span className="text-red-400 font-medium">
                                {formatCurrency(order.amount_remaining || 0, lang)}
                            </span>
                        </div>
                        {order.payments_count > 0 && (
                            <div className="text-xs text-gray-500 text-center pt-1">
                                {t('common.paymentsCount', { count: order.payments_count })}
                            </div>
                        )}
                    </div>

                    {/* Arrow pointing toward the row - centered */}
                    {tooltipPos.placement === 'above' ? (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                                        border-l-[6px] border-l-transparent
                                        border-r-[6px] border-r-transparent
                                        border-t-[6px] border-t-gray-800">
                        </div>
                    ) : (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0
                                        border-l-[6px] border-l-transparent
                                        border-r-[6px] border-r-transparent
                                        border-b-[6px] border-b-gray-800">
                        </div>
                    )}
                </div>
            </div>
        )
    })(),
    document.body
)}
        </div>
    )
}