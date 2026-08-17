import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'

export default function EditCustomer() {
    const { id } = useParams()
    const navigate = useNavigate()
    const {showToast} = useToast()
    const { t } = useTranslation()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
       code: '', name: '', phone: '', address: '', area: '', price_tier: ''
    })

    const { data, isLoading, isError } = useQuery({
        queryKey: ['customers', id],
        queryFn: () => api.get(`/customers/${id}`).then(res => res.data.data),
    })

    useEffect(() => {
        if (isError) showToast(t('customers.edit.loadFailed'), 'error')
    }, [isError, showToast, t])

    const formInitialized = useRef(false)
    useEffect(() => {
        if (data && !formInitialized.current) {
            formInitialized.current = true
            setForm({
                code: data.code || '',
                name: data.name || '',
                phone: data.phone || '',
                address: data.address || '',
                area: data.area || '',
                price_tier: data.price_tier === 'default' ? '' : (data.price_tier || ''),
            })
        }
    }, [data])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.put(`/customers/${id}`, {
                ...form,
                price_tier: form.price_tier || null
            })
            navigate('/customers')
        } catch (err) {
            showToast(err.response?.data?.message || t('customers.edit.updateFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="">
            <div className="flex items-center gap-4 mb-6">
                <BackButton label={t('customers.edit.backToCustomers')} to="/customers"/>
                <h2 className="text-2xl font-bold text-white">{t('customers.edit.title')}</h2>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('common.code')}</label>
                        <input
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('common.name')}</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{t('common.phone')}</label>
                        <input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">{t('common.address')}</label>
                        <input
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div className='col-span-2'>
                        <label className="block text-sm text-gray-400 mb-1">{t('common.area')}</label>
                        <input
                            value={form.area}
                            onChange={e => setForm({ ...form, area: e.target.value })}
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">{t('customers.priceTier')}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {[
                                { value: '', key: 'default' },
                                { value: 'a', key: 'a' },
                                { value: 'b', key: 'b' },
                                { value: 'c', key: 'c' },
                                { value: 'd', key: 'd' },
                                { value: 'e', key: 'e' },
                            ].map(tier => (
                                <button
                                    key={tier.value}
                                    type="button"
                                    onClick={() => {
                                        setForm({ ...form, price_tier: tier.value })
                                        document.getElementById('save-customer').focus()
                                    }}
                                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                                        form.price_tier === tier.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {t(`enums.priceTier.${tier.key}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-2 pt-2">
                        <button
                            id="save-customer"
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? t('common.saving') : t('customers.edit.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}