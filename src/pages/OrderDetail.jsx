import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import { useToast } from '../hooks/useToast'
import AddItemModal from '../components/AddItemModal'
import DeleteModal from '../components/DeleteModal'

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({ order_date: '', notes: '', discount: '' })
    const [editingItem, setEditingItem] = useState(null) // holds item id being edited
    const [itemForm, setItemForm] = useState({ quantity: '', unit_price: '' })
    const[showAddItem,setShowAddItem] = useState(false)
    const [saving, setSaving] = useState(false)
    const [discountType, setDiscountType] = useState('amount')
    const { showToast } = useToast()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const canEdit = user.role === 'tenant_admin' || user.role === 'store_manager'

    const fetchOrder = () => {
        api.get(`/orders/${id}`)
            .then(res => {
                setOrder(res.data)
                setEditForm({
                    order_date: res.data.order_date,
                    notes:      res.data.notes ?? '',
                    discount:   res.data.discount ?? 0,
                })
            })
            .catch(() => showToast('حصلت مشكلة في تحميل الطلب', 'error'))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchOrder() }, [id])

    const handleCancel = async () => {
        setCancelling(true)
        try {
            await api.delete(`/orders/${id}`)
            navigate('/orders')
            showToast('تم إلغاء الطلب بنجاح.', 'success')
        } catch (err) {
            showToast(err.response?.data?.message || 'حصلت مشكلة في إلغاء الطلب', 'error')
            setShowConfirm(false)
        } finally {
            setCancelling(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const discountAmount = discountType === 'percent'
    ? Math.round(order.subtotal * (parseFloat(editForm.discount) || 0) / 100 * 100) / 100
    : parseFloat(editForm.discount) || 0

            const res = await api.patch(`/orders/${id}`, {
                order_date: editForm.order_date,
                notes:      editForm.notes,
                discount:   discountAmount,
            })
            setOrder(res.data)
            setEditMode(false)
            showToast('تم تعديل الطلب بنجاح.', 'success')
        } catch (err) {
            showToast(err.response?.data?.message || 'حصلت مشكلة في تعديل الطلب', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveItem = async (item) => {
        setSaving(true)
        try{
            await api.patch(`/orders/${id}/items/${item.id}` , {
                quantity:itemForm.quantity,
                unit_price:itemForm.unit_price
            })
            showToast('تم تعديل الصنف بنجاح.', 'success')
            setEditingItem(null)
            fetchOrder()
        } catch (err) {
    showToast(err.response?.data?.message || 'حصلت مشكلة في تعديل الصنف', 'error')
} finally {
    setSaving(false)
}
    }

    const handleCancelEdit = () => {
        setEditMode(false)
        setEditForm({
            order_date: order.order_date,
            notes:      order.notes ?? '',
            discount:   order.discount ?? 0,
        })
    }

    if (loading) return <LoadingSpinner />


    const discountPreview = discountType === 'percent'
    ? Math.round(order.subtotal * (parseFloat(editForm.discount) || 0) / 100 * 100) / 100
    : parseFloat(editForm.discount) || 0

const displayTotal = editMode
    ? Math.max(0, order.subtotal - discountPreview)
    : order.total

    const displayAmountDue = editMode
    ? Math.max(0, displayTotal - order.paid)
    : order.amount_remaining

    return (
        <div className="max-w-4xl">
            {/* Back + actions */}
            <div className="flex items-center justify-between mb-6">
                <BackButton label="رجوع" />
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(`/orders/${id}/invoice`, '_blank')}
                        className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                        🖨️ فاتورة
                    </button>

                    {canEdit && !editMode && (
                        <button
                            onClick={() => setEditMode(true)}
                            className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                            ✏️ تعديل
                        </button>
                    )}

                    {editMode && (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </button>
                        </>
                    )}

                    {user.role === 'tenant_admin' && !editMode && (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            إلغاء الطلب
                        </button>
                    )}
                </div>
            </div>

            {/* Order header */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">رقم الفاتورة</p>
                        <p className="text-white text-2xl font-bold font-mono">{order.invoice_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        order.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}>
                        {order.status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">العميل</p>
                        <p className="text-white text-sm font-medium">{order.customer_name}</p>
                        {order.customer_phone && (
                            <p className="text-gray-400 text-sm">{order.customer_phone}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">المتجر</p>
                        <p className="text-white text-sm">{order.store_name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">التاريخ</p>
                        {editMode ? (
                            <input
                                type="date"
                                value={editForm.order_date}
                                onChange={e => setEditForm({ ...editForm, order_date: e.target.value })}
                                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        ) : (
                            <p className="text-white text-sm">
                                {new Date(order.order_date).toLocaleDateString('en-GB')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">أصناف الطلب</h3>
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            {['المنتج', 'الكمية', 'سعر الوحدة', 'المخازن', 'الإجمالي', 'إجراءات'].map(h => (
                                <th key={h} className="text-start text-xs text-gray-400 uppercase tracking-wider pb-3">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                       {order.items.map((item) => (
                        
    <tr key={item.id}>
        <td className="py-3 text-white text-sm">{item.product_name}</td>
        
      <td className="py-3 text-gray-400 text-sm">
    {editingItem === item.id
        ? <input type="number" min="1" value={itemForm.quantity}
            onChange={e => setItemForm({...itemForm, quantity: e.target.value})}
            className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 text-white rounded-lg text-sm"/>
        : <>
            {item.quantity}
            {item.unit_label && (
                <span className={`ms-1 text-xs ${item.unit_type !== 'base' ? 'text-blue-400' : 'text-gray-500'}`}>{item.unit_label}</span>
            )}
          </>
    }
</td>

        <td className="py-3 text-gray-400 text-sm">
            {editingItem === item.id
                ? <input type="number" min="0" step="0.01" value={itemForm.unit_price}
                    onChange={e => setItemForm({...itemForm, unit_price: e.target.value})}
                    className="w-24 px-2 py-1 bg-gray-800 border border-gray-600 text-white rounded-lg text-sm"/>
                : `${item.unit_price} ج.م`
            }
        </td>
        <td className="px-4 py-3 text-gray-400 text-sm">
    {item.warehouse_name ?? '—'}
</td>

        <td className="py-3 text-white text-sm font-medium">{item.total} ج.م</td>

        <td className="py-3">
            {editingItem === item.id ? (
                <div className="flex gap-2">
                    <button onClick={() => handleSaveItem(item)}
                        className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 transition-colors">
                        حفظ
                    </button>
                    <button onClick={() => setEditingItem(null)}
                        className="px-2 py-1 text-gray-400 text-xs">
                        إلغاء
                    </button>
                </div>
            ) : (
                 canEdit && (
                    <button onClick={() => {
                        setEditingItem(item.id)
                        setItemForm({ quantity: item.quantity, unit_price: item.unit_price })
                    }}
                        className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 transition-colors">
                       تعديل
                    </button>
                )
            )}
        </td>
    </tr>
))}
                    </tbody>
                </table>
                </div>
                {/* Add Item */}
{canEdit && (
    <button
        onClick={() => {
    setShowAddItem(true)
}}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
    >
        + إضافة صنف
    </button>
)}

                {/* Totals */}
                <div className="flex justify-end mt-4">
                    <div className="w-56 space-y-2 border-t border-gray-800 pt-4">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>الإجمالي الفرعي</span>
                            <span>{order.subtotal} ج.م</span>
                        </div>
{/* Discount row */}
{editMode ? (
    <div className="flex items-center gap-2">
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {['amount', 'percent'].map(t => (
                <button key={t} type="button"
                    onClick={() => setDiscountType(t)}
                    className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                        discountType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                >
                    {t === 'amount' ? 'ج.م' : '%'}
                </button>
            ))}
        </div>
        <input
            type="number"
            min="0"
            max={discountType === 'percent' ? 100 : undefined}
            value={editForm.discount}
            onChange={e => setEditForm({ ...editForm, discount: e.target.value })}
            className="w-24 px-2 py-1 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm text-end"
        />
    </div>
) : (
    order.discount > 0 && (
        <div className="flex justify-between text-sm text-green-400">
            <span>الخصم</span>
            <span>- {order.discount} ج.م</span>
        </div>
    )
)}


                        <div className="flex justify-between text-base font-bold text-white border-t border-gray-800 pt-2">
                            <span>الإجمالي</span>
                            <span>{displayTotal} ج.م</span>
                        </div>
                        {order.status === 'unpaid' && order.amount_remaining > 0 && (
                            <div className="flex justify-between text-sm text-red-400">
                                <span>المبلغ المستحق</span>
                                <span>{displayAmountDue} ج.م</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
{/* Profit */}
{order.items.some(i => i.cost_price !== null) && (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-4">ملخص الربح</p>
        <div className="flex gap-8">
            <div>
                <p className="text-gray-500 text-xs mb-1">الإيرادات</p>
                <p className="text-white font-semibold">{order.total} ج.م</p>
            </div>
            <div>
                <p className="text-gray-500 text-xs mb-1">التكلفة</p>
                <p className="text-white font-semibold">
                    {order.items.reduce((sum, i) => sum + ((i.cost_price ?? 0) * i.quantity), 0).toFixed(2)} ج.م
                </p>
            </div>
            <div>
                <p className="text-gray-500 text-xs mb-1">إجمالي الربح</p>
                {(() => {
                    const cost = order.items.reduce((sum, i) => sum + ((i.cost_price ?? 0) * i.quantity), 0)
                    const profit = order.total - cost
                    const margin = order.total > 0 ? ((profit / order.total) * 100).toFixed(1) : 0
                    return (
                        <p className={`font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profit.toFixed(2)} ج.م <span className="text-xs text-gray-500">({margin}%)</span>
                        </p>
                    )
                })()}
            </div>
        </div>
    </div>
)}

            {/* Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">ملاحظات</p>
                {editMode ? (
                    <textarea
                        value={editForm.notes}
                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                        rows={3}
                        placeholder="أضف ملاحظات..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm resize-none"
                    />
                ) : (
                    <p className="text-white text-sm">{order.notes || '—'}</p>
                )}
            </div>

            <DeleteModal
            open={!!showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleCancel}
            deleting={cancelling}
            title="إلغاء الطلب"
            name={"طلب " + order.invoice_number}
            warning="ده هيعكس القيد في الحساب ويرجّع المخزون. مش هتقدر ترجع في الخطوة دي."
           />
            
            {showAddItem && (
            <AddItemModal
            open={showAddItem}
            orderId={id}
            onSuccess={() => {
                fetchOrder()
                setShowAddItem(false)
            }}
            onClose={() => setShowAddItem(false)}
            />
    )}
        </div>
    )
}