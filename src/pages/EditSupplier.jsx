import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import { useTranslation } from '../i18n/useTranslation'

export default function EditSupplier() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const { t } = useTranslation()
    const [form, setForm] = useState({
        name: '', phone: '', address: '', notes: '', area: '', code: ''
    })

    // ─── Product linking state ─────────────────────────────────────────
    const [allProducts, setAllProducts] = useState([])
    const [attachedIds, setAttachedIds] = useState(new Set())
    const [togglingId, setTogglingId] = useState(null)

    useEffect(() => {
        Promise.all([
            api.get(`/suppliers/${id}`),
            api.get(`/suppliers/${id}/products`),
            api.get(`/products?per_page=200`),
        ])
            .then(([supplierRes, attachedRes, allProductsRes]) => {
                const c = supplierRes.data.data
                setForm({
                    code: c.code || '',
                    name: c.name || '',
                    phone: c.phone || '',
                    address: c.address || '',
                    notes: c.notes || '',
                    area: c.area || '',
                })
                setAttachedIds(new Set(attachedRes.data.data.map(p => p.id)))
                setAllProducts(allProductsRes.data.data)
            })
            .catch(() => setError(t('suppliers.edit.loadFailed')))
            .finally(() => setLoading(false))
    }, [id])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            await api.put(`/suppliers/${id}`, { ...form })
            navigate('/suppliers')
        } catch (err) {
            setError(err.response?.data?.message || t('suppliers.edit.updateFailed'))
        } finally {
            setSaving(false)
        }
    }

    const toggleProduct = async (productId) => {
        setTogglingId(productId)
        const isAttached = attachedIds.has(productId)
        try {
            if (isAttached) {
                await api.delete(`/suppliers/${id}/products/${productId}`)
                setAttachedIds(prev => {
                    const next = new Set(prev)
                    next.delete(productId)
                    return next
                })
            } else {
                await api.post(`/suppliers/${id}/products/${productId}`)
                setAttachedIds(prev => new Set(prev).add(productId))
            }
        } catch {
            setError(t('suppliers.edit.toggleFailed'))
        } finally {
            setTogglingId(null)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="">
            <div className="flex items-center gap-4 mb-6">
                <BackButton label={t('suppliers.edit.backToSuppliers')} to="/suppliers" />
                <h2 className="text-2xl font-bold text-white">{t('suppliers.edit.title')}</h2>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* ─── Supplier Form ─────────────────────────────────────────── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
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
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">{t('common.notes')}</label>
                        <input
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">{t('common.area')}</label>
                        <input
                            value={form.area}
                            onChange={(e) => setForm({ ...form, area: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                    </div>
                    <div className="col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? t('common.saving') : t('suppliers.edit.submit')}
                        </button>
                    </div>
                </form>
            </div>

            {/* ─── Linked Products ───────────────────────────────────────── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                    {t('suppliers.edit.linkedProducts')}
                    <span className="ms-2 text-sm font-normal text-gray-400">
                        {t('suppliers.edit.attachedCount', { count: attachedIds.size })}
                    </span>
                </h3>

                {allProducts.length === 0 ? (
                    <p className="text-gray-500 text-sm">{t('suppliers.edit.emptyProducts')}</p>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {allProducts.map(product => {
                            const isAttached = attachedIds.has(product.id)
                            const isToggling = togglingId === product.id

                            return (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div>
                                        <p className="text-sm text-white">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.sku}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleProduct(product.id)}
                                        disabled={isToggling}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                            isAttached
                                                ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                                : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                                        }`}
                                    >
                                        {isToggling ? '...' : isAttached ? t('suppliers.edit.unlink') : t('suppliers.edit.link')}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}