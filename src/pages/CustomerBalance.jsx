import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import Modal from '../components/Modal'
import { useToast } from '../hooks/useToast'
import RefundModal from '../components/RefundModal'
import AddCreditModal from '../components/AddCreditModal'
import { paymentMethodLabels, paymentReferenceLabels } from '../lib/labels'
import { typeLabels } from '../lib/auditLog'

const typeStyles = {
        ORDER_CHARGE:    'bg-red-500/20 text-red-400',
        PAYMENT:         'bg-green-500/20 text-green-400',
        REVERSAL:        'bg-yellow-500/20 text-yellow-400',
        CREDIT_APPLY:    'bg-blue-500/20 text-blue-400',
        CREDIT_CONSUMED: 'bg-purple-500/20 text-purple-400',
        REFUND:          'bg-orange-500/20 text-orange-400',
    }

const referenceLabel = paymentReferenceLabels
const methodLabel = paymentMethodLabels
export default function CustomerBalance() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [editPayment , setEditPayment] = useState(null)
    const [editForm, setEditForm] = useState({amount:'' , method:'cash'})
    
    const [paymentModal, setPaymentModal] = useState(false)
    const [autoForm, setAutoForm] = useState({ amount: '', method: 'cash', order_id: '', payment_reference: '' })
    const [refundModal, setRefundModal] = useState(false)
    const [showCreditModal, setShowCreditModal] = useState(false)


    const fetchData = async () => {
        try {
            const res = await api.get(`/customers/${id}/summary`)
            setData(res.data)
        } catch {
            showToast('حصلت مشكلة في تحميل بيانات العميل', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [id])

    const handleAutoPayment = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (autoForm.order_id) {
                await api.post('/payments', {
                    order_id:    parseInt(autoForm.order_id),
                    customer_id: parseInt(id),
                    amount:      parseFloat(autoForm.amount),
                    method:      autoForm.method,
                    payment_reference: autoForm.payment_reference || null,
                })
            } else {
                await api.post('/payments/auto', {
                    customer_id: parseInt(id),
                    amount:      parseFloat(autoForm.amount),
                    method:      autoForm.method,
                    payment_reference: autoForm.payment_reference || null,

                })
            }
            showToast('تم استلام الدفعة بنجاح.', 'success')
            setPaymentModal(false)
            setAutoForm({ amount: '', method: 'cash', order_id: '' })
            fetchData()
        } catch (err) {
            showToast(err.response?.data?.message || 'حصلت مشكلة في تنفيذ الدفع', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleEditPayment = async (e) =>{
        e.preventDefault()
        setSaving(true)
        try{
            await api.patch(`/payments/${editForm.id}`, {
                amount: parseFloat(editForm.amount),
                method: editForm.method,
            })
            showToast('تم تعديل الدفعة بنجاح', 'success')
            setEditPayment(false)
            setEditForm({amount: '', method: 'cash'})
            fetchData()
        }catch(err){
            showToast(err.response?.data?.message || 'فشل تعديل الدفعة', 'error')
        }finally{
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner />
    if (!data) return null

        const visiblePayments = data.payments.filter(p => !p.is_auto_reversible)
        
    const isOwed  = data.balance > 0
    const isCredit = data.balance < 0
    const unpaidOrders = data.orders.filter(o => o.status === 'unpaid')
    const paidOrders   = data.orders.filter(o => o.paid > 0)



    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <BackButton label="رجوع للعملاء" to="/customers" />
                <h2 className="text-2xl font-bold text-white">{data.customer_name}</h2>
            </div>

            {/* Balance card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-gray-400 text-sm mb-1">الرصيد الحالي</p>
                        <p className={`text-4xl font-bold ${isOwed ? 'text-red-400' : isCredit ? 'text-green-400' : 'text-gray-400'}`}>
                            {parseFloat(data.balance).toFixed(2)} ج.م
                        </p>
                        <p className={`text-sm mt-1 ${isOwed ? 'text-red-400' : isCredit ? 'text-green-400' : 'text-gray-500'}`}>
                            {data.status === 'owes' ? 'العميل عليه فلوس' :
                             data.status === 'credit' ? 'العميل ليه رصيد' :
                             'متسدد بالكامل'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setRefundModal(true)}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                            ↩ عمل مرتجع
                        </button>
                        <button
                            onClick={() => setShowCreditModal(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                            + إضافة رصيد
                        </button>
                        <button onClick={() => setPaymentModal(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
                            💰 استلام دفعة
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">إجمالي الطلبات</p>
                        <p className="text-white text-xl font-bold">{data.stats.total_orders}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">الطلبات غير المدفوعة</p>
                        <p className={`text-xl font-bold ${data.stats.unpaid_orders > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {data.stats.unpaid_orders}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">إجمالي المطلوب</p>
                        <p className="text-white text-xl font-bold">{data.stats.total_ordered} ج.م</p>
                    </div>
                </div>
            </div>

            {/* Orders */}
            <h3 className="text-white font-semibold mb-3">الطلبات</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-6">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['الفاتورة', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة', 'التاريخ'].map(h => (
                                <th key={h} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {data.orders.map(order => (
                            <tr key={order.id}
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="hover:bg-gray-800/50 transition-colors cursor-pointer">
                                <td className="px-4 py-3 text-gray-400 text-sm font-mono">{order.invoice_number}</td>
                                <td className="px-4 py-3 text-white text-sm">{order.total} ج.م</td>
                                <td className="px-4 py-3 text-green-400 text-sm">{order.paid} ج.م</td>
                                <td className="px-4 py-3 text-red-400 text-sm">{order.amount_remaining} ج.م</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        order.status === 'paid'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                    }`}>{order.status}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {order.order_date
                                        ? new Date(order.order_date).toLocaleDateString('en-GB')
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.orders.length === 0 && (
                    <div className="text-center py-16 text-gray-500">مفيش طلبات لسه.</div>
                )}
            </div>

            {/* Payments */}
            <h3 className="text-white font-semibold mb-3">الدفعات</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-6">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['الفاتورة', 'المبلغ', 'المسترد', 'الصافي', 'طريقة الدفع', 'المرجع', 'التاريخ', 'إجراءات'].map(h => (
                                <th key={h} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {visiblePayments.map(p => (
                            <tr key={p.id}
                                className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 text-gray-400 text-sm font-mono">{p.invoice_number}</td>
                                <td className="px-4 py-3 text-white text-sm">{p.amount} ج.م</td>
                                <td className="px-4 py-3 text-orange-400 text-sm">
                                    {p.refunded_amount > 0 ? `${p.refunded_amount} ج.م` : '—'}
                                </td>
                                <td className="px-4 py-3 text-green-400 text-sm">{p.net_amount} ج.م</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{methodLabel[p.method] ?? p.method}</td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
    {p.payment_reference ? p.payment_reference : '—'}
</td>

                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {new Date(p.paid_at).toLocaleDateString('en-GB')}
                                </td>
                                <td className='px-4 py-3 text-gray-400 text-sm'>
                                 <button
    onClick={() => {
        setEditPayment(true)
        setEditForm({ id: p.id, amount: p.amount, method: p.method })
    }}
    disabled={p.refunded_amount > 0}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        p.refunded_amount > 0
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
    }`}
>
    تعديل
</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {visiblePayments.length === 0 && (
                    <div className="text-center py-16 text-gray-500">مفيش دفعات لسه.</div>
                )}
            </div>

            {/* Transaction History */}
            <h3 className="text-white font-semibold mb-3">سجل المعاملات</h3>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto mb-6">
                <table className="w-full">
                    <thead className="bg-gray-800">
                        <tr>
                            {['النوع', 'المبلغ', 'الوصف', 'التاريخ'].map(h => (
                                <th key={h} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {data.history?.map((entry, i) => (
                            <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${typeStyles[entry.type] || 'bg-gray-700 text-gray-300'}`}>
                                        {typeLabels[entry.type] || entry.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white text-sm">{entry.amount} ج.م</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{entry.description || '—'}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">
                                    {new Date(entry.created_at).toLocaleDateString('en-GB')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!data.history || data.history.length === 0) && (
                    <div className="text-center py-16 text-gray-500">مفيش معاملات لسه.</div>
                )}
            </div>

            {/* Payment Modal */}
            <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="💰 استلام دفعة">
                <div className="space-y-4">
                    {unpaidOrders.length === 0 ? (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-blue-400 text-sm">مفيش طلبات غير مدفوعة. المبلغ هيتسجل كرصيد.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {unpaidOrders.map((o, i) => (
                                <div key={o.id} className="flex justify-between text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded-lg">
                                    <span>#{i + 1} — {o.invoice_number}</span>
                                    <span>{o.amount_remaining} ج.م</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleAutoPayment} className="space-y-4">
                        {unpaidOrders.length > 0 && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    دفع لطلب محدد
                                    <span className="text-gray-600 ms-1">(اختياري — سيبه فاضي للتلقائي)</span>
                                </label>
                                <select value={autoForm.order_id}
                                    onChange={e => setAutoForm({ ...autoForm, order_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm">
                                    <option value="">سدد الأقدم الأول (تلقائي)</option>
                                    {unpaidOrders.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.invoice_number} — {o.amount_remaining} ج.م
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">المبلغ</label>
                                <input type="number" value={autoForm.amount}
                                    onChange={e => setAutoForm({ ...autoForm, amount: e.target.value })}
                                    required min="0.01" step="0.01"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                    placeholder="e.g. 500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">طريقة الدفع</label>
                                <select
                                    value={autoForm.method}
                                    onChange={e => setAutoForm({ ...autoForm, method: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                >
                                    {Object.entries(methodLabel).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                              {referenceLabel[autoForm.method] && (
    <div>
        <label className="block text-sm text-gray-400 mb-1">
            {referenceLabel[autoForm.method]}
        </label>
        <input
            type="text"
            value={autoForm.payment_reference}
            onChange={e => setAutoForm({ ...autoForm, payment_reference: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
            placeholder={referenceLabel[autoForm.method]}
        />
    </div>
)}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setPaymentModal(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                إلغاء
                            </button>
                            <button type="submit" disabled={saving || !autoForm.amount}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                {saving ? 'جاري التنفيذ...' : 'استلام الدفعة'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal open={!!editPayment} onClose={()=> setEditPayment(false)} title="تعديل الدفعة">
                <form onSubmit={handleEditPayment} className='space-y-4'>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">المبلغ</label>
                                <input type="number" value={editForm.amount}
                                    onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                    required min="0.01" step="0.01"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                                    placeholder="e.g. 500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">طريقة الدفع</label>
                                <select value={editForm.method}
                                    onChange={e => setEditForm({ ...editForm, method: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm">
                                    <option value="cash">نقدي</option>
                                    <option value="bank_transfer">تحويل بنكي</option>
                                    <option value="check">شيك</option>
                                </select>
                            </div>
                        </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setEditPayment(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                إلغاء
                            </button>
                            <button type="submit" disabled={saving || !editForm.amount}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                {saving ? 'جاري التنفيذ...' : 'تعديل الدفعة'}
                            </button>
                        </div>
                        </form>
            </Modal>

            <RefundModal 
                open={refundModal}
                onClose={() => setRefundModal(false)}
                orders={paidOrders}
                payments={data.payments}
                customerId={id}
                onSuccess={fetchData}
            />
            {showCreditModal && (
                <AddCreditModal
                    customer={data}
                    onClose={() => setShowCreditModal(false)}
                    onSuccess={fetchData}
                />
            )}
         
        </div>
    )
}