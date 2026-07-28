import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import BackButton from '../components/BackButton'
import {useToast} from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'

export default function CreateCustomer() {
    const [saving, setSaving] = useState(false)
const {showToast} = useToast()
const { t } = useTranslation()
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
            showToast(t('customers.create.created'), 'success')
        } catch (err) {
            showToast(err.response?.data?.message || t('customers.create.createFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <BackButton label={t('customers.create.backToCustomers')} to="/customers" />
                <h2 className="text-2xl font-bold text-white">{t('customers.create.title')}</h2>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Code + Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">{t('common.code')}</label>
                            <input
                                value={form.code}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                placeholder={t('customers.form.codePlaceholder')}
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <p className="text-gray-500 text-xs mt-1">{t('customers.form.codeHint')}</p>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">
                                {t('common.name')} <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder={t('customers.form.namePlaceholder')}
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Phone + Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">
                                {t('common.phone')} <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                required
                                placeholder={t('customers.form.phonePlaceholder')}
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">{t('common.area')}</label>
                            <input
                                value={form.area}
                                onChange={e => setForm({ ...form, area: e.target.value })}
                                placeholder={t('customers.form.areaPlaceholder')}
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Address (full width) */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">{t('common.address')}</label>
                        <input
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            placeholder={t('customers.form.addressPlaceholder')}
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Price Tier */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('customers.priceTier')}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {['default', 'a', 'b', 'c', 'd', 'e'].map(tier => (
                                <button
                                    key={tier}
                                    type="button"
                                    onClick={() => setForm({ ...form, price_tier: tier })}
                                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        form.price_tier === tier
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {t(`enums.priceTier.${tier}`)}
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
                            {saving ? t('common.saving') : t('customers.create.submit')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/customers')}
                            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}