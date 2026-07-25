import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BackButton from '../components/BackButton'

export default function CreateSupplier() {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        code: '', name: '', phone: '', address: '', area: '', notes: ''
    })
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            await api.post('/suppliers', {
                ...form,
                
            })
            navigate('/suppliers')
        } catch (err) {
            setError(err.response?.data?.message || 'حصلت مشكلة في إنشاء المورد')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="">
            <div className="flex items-center gap-4 mb-6">
                <BackButton label="رجوع للموردين" to="/suppliers"/>
                <h2 className="text-2xl font-bold text-white">إضافة مورد جديد</h2>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">الكود</label>
                        <input
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">الاسم</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">التليفون</label>
                        <input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">العنوان</label>
                        <input
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
                        <input
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">المنطقة</label>
                        <input
                            value={form.area}
                            onChange={(e) => setForm({ ...form, area: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div className="col-span-2 pt-2">
                        <button
                            id="save-supplier"
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? 'جاري الحفظ...' : 'حفظ المورد'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}