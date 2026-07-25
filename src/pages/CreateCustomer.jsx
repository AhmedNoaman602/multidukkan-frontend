import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BackButton from '../components/BackButton'
import {useToast} from '../hooks/useToast'

export default function CreateCustomer() {
    const [saving, setSaving] = useState(false)
const {showToast} = useToast()   
 const [form, setForm] = useState({
        code: '',
        name: '',
        phone: '',
        area: '',
        address: '',
        price_tier: 'default'
    })
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post('/customers', {
                ...form,
                code: form.code || null,
            })
            navigate('/customers')
            showToast('تم إضافة العميل بنجاح','success')
        } catch (err) {
            showToast(err.response?.data?.message || 'حصلت مشكلة في إنشاء العميل','error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <BackButton label="رجوع للعملاء" to="/customers" />
                <h2 className="text-2xl font-bold text-white">إضافة عميل جديد</h2>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Code + Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">الكود</label>
                            <input
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                placeholder="يتولد تلقائي (C-XXX)"
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">سيبه فاضي عشان يتولد تلقائي</p>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">
                                Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="اسم العميل"
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Phone + Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">
                                Phone <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                required
                                placeholder="رقم التليفون"
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">المنطقة</label>
                            <input
                                value={form.area}
                                onChange={e => setForm({ ...form, area: e.target.value })}
                                placeholder="المنطقة أو الحي"
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Address (full width) */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">العنوان</label>
                        <input
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            placeholder="العنوان بالكامل"
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Price Tier */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">فئة السعر</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {[
                                { value: 'default', label: 'افتراضي' },
                                { value: 'a', label: 'سعر أ' },
                                { value: 'b', label: 'سعر ب' },
                                { value: 'c', label: 'سعر ج' },
                                { value: 'd', label: 'سعر د' },
                                { value: 'e', label: 'سعر هـ' },
                            ].map(tier => (
                                <button
                                    key={tier.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, price_tier: tier.value })}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        form.price_tier === tier.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {tier.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? 'جاري الحفظ...' : 'حفظ العميل'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/customers')}
                            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}