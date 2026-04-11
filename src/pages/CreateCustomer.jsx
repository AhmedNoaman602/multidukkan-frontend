import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function CreateCustomer() {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: '', phone: '', address: '', price_tier: 'default'
    })
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post('/customers', form)
            navigate('/customers')
        } catch (err) {
            setError('Failed to create customer')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-bold text-white">Add New Customer</h2>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Phone</label>
                        <input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Address</label>
                        <input
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">Price Tier</label>
                        <div className="grid grid-cols-6 gap-2">
                            {[
                                { value: 'default', label: 'Default' },
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
                                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
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

                    <div className="col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}