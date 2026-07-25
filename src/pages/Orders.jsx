import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import Modal from '../components/Modal'
import StatBoxes from '../components/StatBoxes'
import RefundModal from '../components/RefundModal'
import {useToast} from '../hooks/useToast'
import QuickSaleModal from '../components/QuickSaleModal'

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
            .catch(() => showToast('حصلت مشكلة في تحميل الطلبات', 'error'))
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
            showToast('تم تسجيل الدفع بنجاح!', 'success')
            setTimeout(() => {
                setPayTarget(null)
                setPayForm({ amount: '', method: 'cash' })
                fetchOrders()
            }, 1000)
        } catch (err) {
            showToast(err.response?.data?.message || 'حصلت مشكلة في تنفيذ الدفع', 'error')
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

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="mb-6 space-y-3">
    {/* Top row */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">الطلبات</h2>
        <div className="flex items-center gap-2 flex-wrap">
                   <button
    onClick={async () => {
        await fetchQuickSaleData()
        setShowQuickSale(true)
    }}
    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
>
    ⚡ بيع سريع
</button>
        <button
            onClick={() => navigate('/orders/create')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
            + طلب جديد
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
                placeholder="ابحث بالعميل أو رقم الفاتورة..."
            />
        </div>
    </div>

    {/* Filter mode pills */}
    <div className="flex justify-start items-center gap-2 flex-wrap ">
        <span className="text-gray-500 text-xs uppercase tracking-wider">تصفية:</span>

        {[
            { label: 'كل الفترات', value: 'all' },
            { label: 'اليوم', value: 'today' },
            { label: 'الشهر', value: 'month' },
            { label: 'السنة', value: 'year' },
            { label: 'فترة', value: 'range' },
            { label: 'تاريخ محدد', value: 'exact' },
        ].map(mode => (
            <button
                key={mode.value}
                type="button"
                onClick={() => {
                    setFilterMode(mode.value)
                    setYearFilter('')
                    setMonthFilter('')
                    setDateFrom('')
                    setDateTo('')
                    setDateExact('')
                    setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterMode === mode.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
            >
                {mode.label}
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
                <option value="">اختر السنة</option>
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
                <option value="">اختر السنة</option>
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
            <select
                value={monthFilter}
                onChange={(e) => { setMonthFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
                <option value="">اختر الشهر</option>
                {['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
                ].map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                ))}
            </select>
        </div>
    )}

    {filterMode === 'range' && (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">من</span>
                <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || new Date().toISOString().split('T')[0]}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">إلى</span>
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
                مسح ✕
            </button>
        )}
</div>
</div>

            {stats && (
                <StatBoxes stats={[
                    { label: 'إجمالي الطلبات', value: stats.total_orders, color: 'white'  },
                    { label: 'إجمالي الإيرادات', value: `${stats.total_revenue} ج.م`, color: 'white'  },
                    { label: 'المدفوع', value: `${stats.paid_amount} ج.م`, color: 'green'  },
                    { label: 'غير المدفوع', value: `${stats.unpaid_amount} ج.م`, color: 'red'    },
                ]} />
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['الفاتورة', 'العميل', 'الأصناف', 'الإجمالي', 'الحالة', 'التاريخ', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {h}
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
                                <td className="px-4 py-3 text-gray-400 text-sm">{order.items_count} units</td>
                                <td className="px-4 py-3 text-white text-sm">{order.total} ج.م</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        order.status === 'paid'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>
                                        {order.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {order.order_date
                                        ? new Date(order.order_date).toLocaleDateString('en-GB')
                                        : new Date(order.created_at).toLocaleDateString('en-GB')}
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
                                            فاتورة
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
                                                دفع
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
                                             مرتجع
                                         </button>
                                        )}
                                        {order.refundable_amount === 0 && order.payments_count > 0 && !isWalkIn(order) && (
   <span
    title="المبلغ ده رصيد آجل مش دفعة. الغِ الطلب بدل ما تعمل مرتجع."
    className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-500 text-xs font-medium rounded-lg cursor-help"
>
    مرتجع ⓘ
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
{hasActiveFilters ? 'مفيش طلبات مطابقة للتصفية.' : 'مفيش طلبات لسه.'}                    </div>
                )}
            </div>

            {lastPage > 1 && (
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => setPage(p => p - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        → السابق
                    </button>
                    <span className="text-gray-400 text-sm">Page {page} of {lastPage}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page === lastPage}
                        className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors"
                    >
                        التالي ←
                    </button>
                </div>
            )}

            <Modal
                open={!!payTarget}
                onClose={() => {
                    setPayTarget(null)
                    setPayForm({ amount: '', method: 'cash' })
                }}
                title={`Pay — ${payTarget?.invoice_number}`}
            >
                {payTarget && (
                    <form onSubmit={handlePay} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">المبلغ</label>
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
                            <label className="block text-sm text-gray-400 mb-1">طريقة الدفع</label>
                            <select
                                value={payForm.method}
                                onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                            >
                                <option value="cash">نقدي</option>
                                <option value="bank_transfer">تحويل بنكي</option>
                                <option value="check">شيك</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setPayTarget(null)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                disabled={paying || !payForm.amount}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {paying ? 'جاري التنفيذ...' : 'تأكيد الدفع'}
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
                            <span className="text-gray-400">Total:</span>
                            <span className="text-white font-medium">{order.total} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Paid:</span>
                            <span className="text-green-400 font-medium">
                                {getPaidAmount(order)} ج.م
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-700 pt-2">
                            <span className="text-gray-400">Remaining:</span>
                            <span className="text-red-400 font-medium">
                                {order.amount_remaining || 0} ج.م
                            </span>
                        </div>
                        {order.payments_count > 0 && (
                            <div className="text-xs text-gray-500 text-center pt-1">
                                {order.payments_count} payment{order.payments_count !== 1 ? 's' : ''}
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