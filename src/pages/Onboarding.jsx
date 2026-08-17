import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../hooks/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Onboarding() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const { showToast } = useToast()
    const { t, dir } = useTranslation()
    const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight

    const STEPS = [
        { label: 'Welcome' },
        { label: 'Store' },
        { label: 'Warehouse' },
        { label: 'Product' },
        { label: 'Customer' },
        { label: 'Team' },
        { label: 'Done' },
    ]

    const [step, setStep] = useState(1)
    const [createdStoreId, setCreatedStoreId] = useState(null)
    const [createdWarehouseId, setCreatedWarehouseId] = useState(null)
    const [productCreated, setProductCreated] = useState(false)
    const [customerCreated, setCustomerCreated] = useState(false)
    const [teamCreated, setTeamCreated] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showNewUnit, setShowNewUnit] = useState(false)
    const [newUnit, setNewUnit] = useState('')
    const [savingUnit, setSavingUnit] = useState(false)
    const queryClient = useQueryClient()

    const [storeForm, setStoreForm] = useState({ name: '', address: '', phone: '' })
    const [warehouseForm, setWarehouseForm] = useState({ name: '', address: '' })
    const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', cost_price: '', unit: '', quantity: 1 })
    const [customerForm, setCustomerForm] = useState({ name: '', phone: '', price_tier: '' })
    const [teamForm, setTeamForm] = useState({ name: '', email: '', password: '', role: 'store_manager' })

    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: () => api.get('/units').then(res => res.data.data),
    })

    const defaultUnitSet = useRef(false)
    useEffect(() => {
        if (units.length > 0 && !defaultUnitSet.current) {
            defaultUnitSet.current = true
            setProductForm(f => ({ ...f, unit: units[0].name }))
        }
    }, [units])

    const handleSaveUnit = async () => {
        if (!newUnit.trim()) return
        setSavingUnit(true)
        try {
            const res = await api.post('/units', { name: newUnit.trim() })
            const saved = res.data.data ?? res.data
            queryClient.setQueryData(['units'], (prev = []) => [...prev, saved])
            setProductForm(f => ({ ...f, unit: saved.name }))
            showToast(t('onboarding.product.unitAdded'), 'success')
            setNewUnit('')
            setShowNewUnit(false)
        } catch {
            showToast(t('onboarding.product.unitAddFailed'), 'error')
        } finally {
            setSavingUnit(false)
        }
    }

    const handleNext = async () => {
        setLoading(true)
        try {
            if (step === 1) {
                setStep(2)
            } else if (step === 2) {
                if (!createdStoreId) {
                    const res = await api.post('/stores', storeForm)
                    setCreatedStoreId(res.data.data.id)
                }
                setStep(3)
            } else if (step === 3) {
                if (!createdWarehouseId) {
                    const res = await api.post('/warehouses', { ...warehouseForm, store_id: createdStoreId })
                    setCreatedWarehouseId(res.data.data.id)
                }
                setStep(4)
            } else if (step === 4) {
                if (!productCreated) {
                    const qty = parseInt(productForm.quantity);
                    if (isNaN(qty) || qty < 1) {
                        showToast(t('onboarding.product.quantityInvalid'), 'error');
                        setLoading(false);
                        return;
                    }
                    await api.post('/products', {
                        ...productForm,
                        price: parseFloat(productForm.price),
                        cost_price: productForm.cost_price ? parseFloat(productForm.cost_price) : null,
                        stocks: createdWarehouseId && parseInt(productForm.quantity) > 0
                            ? [{ warehouse_id: parseInt(createdWarehouseId), quantity: parseInt(productForm.quantity) || 0, threshold: 10 }]
                            : []
                    })
                    setProductCreated(true)
                }
                setStep(5)
            } else if (step === 5) {
                if (!customerCreated) {
                    await api.post('/customers', { ...customerForm, price_tier: customerForm.price_tier || null })
                    setCustomerCreated(true)
                }
                setStep(6)
            } else if (step === 6) {
                if (!teamCreated) {
                    await api.post('/users', { ...teamForm, store_id: createdStoreId })
                    setTeamCreated(true)
                }
                setStep(7)
            } else if (step === 7) {
                const res = await api.get('/me')
                localStorage.setItem('user', JSON.stringify(res.data))
                window.location.href = '/dashboard'
                return
            }
        } catch (err) {
            showToast(err.response?.data?.message || t('onboarding.genericError'), 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = () => setStep(step + 1)
    const handleBack = () => setStep(step - 1)

    const canSubmit = () => {
        if (loading) return false
        if (step === 2) return storeForm.name.trim() !== ''
        if (step === 3) return warehouseForm.name.trim() !== ''
        if (step === 4) return productForm.name.trim() !== '' && productForm.sku.trim() !== '' && productForm.price !== '' && productForm.unit.trim() !== ''
        if (step === 5) return customerForm.name.trim() !== '' && customerForm.phone.trim() !== ''
        if (step === 6) return teamForm.name.trim() !== '' && teamForm.email.trim() !== '' && teamForm.password.trim() !== ''
        return true
    }

    const getButtonLabel = () => {
        const labels = {
            1: t('onboarding.nav.buttons.start'),
            2: t('onboarding.nav.buttons.createStore'),
            3: t('onboarding.nav.buttons.createWarehouse'),
            4: t('onboarding.nav.buttons.addProduct'),
            5: t('onboarding.nav.buttons.addCustomer'),
            6: t('onboarding.nav.buttons.addStaff'),
            7: t('onboarding.nav.buttons.goToDashboard'),
        }
        return labels[step] || t('onboarding.nav.buttons.next')
    }

    const inp = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 text-sm'
    const lbl = 'block text-sm text-gray-400 mb-1'

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <div dir="ltr" className="flex flex-col items-start">
                        <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5" dir='ltr'>
                            <span className="text-3xl">🏪</span>
                        </div>
                        <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase mb-2" dir='ltr'>MultiDukkan</p>
                        </div>
<h2 className="text-2xl font-bold text-white mb-2">

  <span>
    {t('onboarding.welcome.greeting')}
  </span>{' '}
  <bdi>{user.name}</bdi>
</h2>
<p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            {t('onboarding.welcome.subtitle')}
                        </p>
                        <div className="space-y-2">
                            {[
                                { label: t('onboarding.welcome.checklist.createStore'), optional: false },
                                { label: t('onboarding.welcome.checklist.createWarehouse'), optional: false },
                                { label: t('onboarding.welcome.checklist.addProduct'), optional: true },
                                { label: t('onboarding.welcome.checklist.addCustomer'), optional: true },
                                { label: t('onboarding.welcome.checklist.addStaff'), optional: true },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-gray-800/60 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/15 text-purple-400 text-xs font-medium flex items-center justify-center flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <span className="text-gray-200 text-sm flex-1">{item.label}</span>
                                    {item.optional && <span className="text-xs text-gray-600">{t('common.optional')}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase mb-2">{t('onboarding.store.stepLabel')}</p>
                        <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.store.title')}</h2>
                        <p className="text-gray-400 text-sm mb-6">{t('onboarding.store.subtitle')}</p>
                        <div className="space-y-3">
                            <div>
                                <label className={lbl}>{t('onboarding.store.nameRequired')}</label>
                                <input value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} placeholder={t('onboarding.store.namePlaceholder')} className={inp} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={lbl}>{t('common.address')}</label>
                                    <input value={storeForm.address} onChange={e => setStoreForm({ ...storeForm, address: e.target.value })} placeholder={t('onboarding.store.addressPlaceholder')} className={inp} />
                                </div>
                                <div>
                                    <label className={lbl}>{t('onboarding.store.phoneLabel')}</label>
                                    <input value={storeForm.phone} onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })} placeholder={t('onboarding.store.phonePlaceholder')} className={inp} />
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase mb-2">{t('onboarding.warehouse.stepLabel')}</p>
                        <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.warehouse.title')}</h2>
                        <p className="text-gray-400 text-sm mb-6">{t('onboarding.warehouse.subtitle')}</p>
                        <div className="space-y-3">
                            <div>
                                <label className={lbl}>{t('onboarding.warehouse.nameRequired')}</label>
                                <input value={warehouseForm.name} onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })} placeholder={t('onboarding.warehouse.namePlaceholder')} className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>{t('common.address')}</label>
                                <input value={warehouseForm.address} onChange={e => setWarehouseForm({ ...warehouseForm, address: e.target.value })} placeholder={t('onboarding.warehouse.addressPlaceholder')} className={inp} />
                            </div>
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase mb-2">{t('onboarding.product.stepLabel')}</p>
                        <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.product.title')}</h2>
                        <p className="text-gray-400 text-sm mb-6">{t('onboarding.product.subtitle')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={lbl}>{t('onboarding.product.nameRequired')}</label>
                                <input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder={t('onboarding.product.namePlaceholder')} className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>{t('onboarding.product.skuRequired')}</label>
                                <input value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} placeholder={t('onboarding.product.skuPlaceholder')} className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>{t('onboarding.product.priceRequired')}</label>
                                <input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00" className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>{t('onboarding.product.costPriceOptional')} <span className="text-gray-600">({t('common.optional')})</span></label>
                                <input type="number" value={productForm.cost_price} onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })} placeholder={t('onboarding.product.costPricePlaceholder')} className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>{t('onboarding.product.unitRequired')}</label>
                                <div className="flex gap-2">
                                    <select value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} className={`${inp} flex-1`}>
                                        {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => setShowNewUnit(!showNewUnit)} className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-xs transition-colors">
                                        {t('onboarding.product.newUnitButton')}
                                    </button>
                                </div>
                                {showNewUnit && (
                                    <div className="flex gap-2 mt-2">
                                        <input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder={t('onboarding.product.newUnitPlaceholder')} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSaveUnit())} className={`${inp} flex-1 border-purple-500`} autoFocus />
                                        <button type="button" onClick={handleSaveUnit} disabled={savingUnit} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs">
                                            {savingUnit ? '...' : t('common.save')}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={lbl}>{t('onboarding.product.quantityLabel')}</label>
                                <input type="number" min="1" value={productForm.quantity} onChange={e => setProductForm({ ...productForm, quantity: e.target.value })} placeholder="0" className={inp} />
                            </div>
                        </div>
                    </div>
                )

            case 5:
                return (
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase mb-2">{t('onboarding.customer.stepLabel')}</p>
                        <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.customer.title')}</h2>
                        <p className="text-gray-400 text-sm mb-6">{t('onboarding.customer.subtitle')}</p>
                        <div className="space-y-3">
                            <div>
                                <label className={lbl}>{t('onboarding.customer.nameRequired')}</label>
                                <input value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder={t('onboarding.customer.namePlaceholder')} className={inp} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={lbl}>{t('onboarding.customer.phoneRequired')}</label>
                                    <input value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder={t('onboarding.customer.phonePlaceholder')} className={inp} />
                                </div>
                                <div>
                                    <label className={lbl}>{t('onboarding.customer.priceTierLabel')}</label>
                                    <select value={customerForm.price_tier} onChange={e => setCustomerForm({ ...customerForm, price_tier: e.target.value })} className={inp}>
                                        <option value="">{t('enums.priceTier.default')}</option>
                                        {['a', 'b', 'c', 'd', 'e'].map(tier => (
                                            <option key={tier} value={tier}>{t(`enums.priceTier.${tier}`)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 6:
                return (
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-purple-400 uppercase mb-2">{t('onboarding.team.stepLabel')}</p>
                        <h2 className="text-xl font-bold text-white mb-1">{t('onboarding.team.title')}</h2>
                        <p className="text-gray-400 text-sm mb-6">{t('onboarding.team.subtitle')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={lbl}>{t('onboarding.team.nameRequired')}</label>
                                <input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder={t('onboarding.team.namePlaceholder')} className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>{t('onboarding.team.emailRequired')}</label>
                                <input type="email" value={teamForm.email} onChange={e => setTeamForm({ ...teamForm, email: e.target.value })} placeholder={t('onboarding.team.emailPlaceholder')} className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>{t('onboarding.team.passwordRequired')}</label>
                                <input type="password" value={teamForm.password} onChange={e => setTeamForm({ ...teamForm, password: e.target.value })} placeholder={t('onboarding.team.passwordPlaceholder')} className={inp} />
                            </div>
                            <div>
                                <label className={lbl}>{t('onboarding.team.roleLabel')}</label>
                                <select value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} className={inp}>
                                    <option value="store_manager">{t('enums.role.store_manager')}</option>
                                    <option value="store_staff">{t('enums.role.store_staff')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )

            case 7:
                return (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('onboarding.done.title')}</h2>
                        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                            {t('onboarding.done.subtitle')}
                        </p>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="max-w-xl w-full">

                {/* Step progress dots */}
                {step > 1 && step < 7 && (
                    <div className="flex items-center gap-2 mb-6 px-1">
                        {STEPS.slice(1, 6).map((s, i) => {
                            const stepNum = i + 2
                            const isDone = step > stepNum
                            const isActive = step === stepNum
                            return (
                                <div key={i} className="flex items-center gap-2 flex-1">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-all ${
                                        isDone ? 'bg-green-500/20 text-green-400' :
                                        isActive ? 'bg-purple-600 text-white' :
                                        'bg-gray-800 text-gray-600 border border-gray-700'
                                    }`}>
                                        {isDone ? '✓' : stepNum - 1}
                                    </div>
                                    {i < 4 && (
                                        <div className={`flex-1 h-px ${isDone ? 'bg-green-500/30' : 'bg-gray-800'}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                    {renderStep()}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={handleBack}
                            disabled={step === 1 || step === 7}
                            className="flex items-center text-sm text-gray-500 hover:text-white transition-colors disabled:opacity-0"
                        >
                            {!loading && <BackIcon size={16} />}{t('common.back')}
                        </button>

                        <div className="flex items-center gap-3">
                            {[4, 5, 6].includes(step) && (
                                <button onClick={handleSkip} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                                    {t('onboarding.nav.skip')}
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                disabled={!canSubmit()}
                                className={`px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${
                                    step === 7
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                            >
                                {loading ? t('onboarding.nav.pleaseWait') : getButtonLabel()}
                                {!loading && <NextIcon size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
