import { useState , useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import {useToast} from '../hooks/useToast'

const STEP_LABELS = [
    'Welcome',
    'Create Store',
    'Create Warehouse',
    'Add Product',
    'Add Customer',
    'Add Team Member',
    'Done'
]

export default function Onboarding() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const [step, setStep] = useState(1)
    const [createdStoreId, setCreatedStoreId] = useState(null)
    const [loading, setLoading] = useState(false)

    const [storeForm, setStoreForm] = useState({ name: '', address: '', phone: '' })
    const [warehouseForm, setWarehouseForm] = useState({ name: '', address: '' })
    const [createdWarehouseId , setCreatedWarehouseId] = useState(null);
    const [productCreated, setProductCreated] = useState(false)
const [customerCreated, setCustomerCreated] = useState(false)
const [teamCreated, setTeamCreated] = useState(false)
const [showNewUnit, setShowNewUnit] = useState(false)
const [newUnit, setNewUnit] = useState('')
const [savingUnit, setSavingUnit] = useState(false)
    const [units, setUnits] = useState([])
    const {showToast} = useToast()

useEffect(() => {
    api.get('/units').then(res => setUnits(res.data.data))
}, [])
const [productForm, setProductForm] = useState({ 
    name: '', sku: '', price: '', unit: units[0]?.name || '', quantity: 0 , cost_price:''
})    

const [customerForm, setCustomerForm] = useState({ name: '', phone: '', price_tier: '' })
    const [teamForm, setTeamForm] = useState({ name: '', email: '', password: '', role: 'store_manager' })

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
}else if (step === 4) {
    if(!productCreated){
    await api.post('/products', {
        ...productForm,
        price: parseFloat(productForm.price),
        cost_price: productForm.cost_price ? parseFloat(productForm.cost_price) : null,
        stocks: createdWarehouseId && parseInt(productForm.quantity) > 0
        ? [{
            warehouse_id: parseInt(createdWarehouseId),
            quantity: parseInt(productForm.quantity) || 0,
            threshold: 10,
          }]
        : []
    })
    setProductCreated(true)
}
    setStep(5)
} else if (step === 5) {
    if(!customerCreated){
                await api.post('/customers', {
                    ...customerForm,
                price_tier:customerForm.price_tier || null
                })
                setCustomerCreated(true)
            }
                setStep(6)
            } else if (step === 6) {
                if(!teamCreated){
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
            showToast(err.response?.data?.message || 'Something went wrong. Please try again.' , 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = () => {
        setStep(step + 1)
    }

    const handleBack = () => {
        setStep(step - 1)
    }
   const handleSaveUnit = async () => {
        if (!newUnit.trim()) return
        setSavingUnit(true)
        try {
            const res = await api.post('/units', { name: newUnit.trim() })
            const saved = res.data.data ?? res.data
            setUnits(prev => [...prev, saved])
            setProductForm(f => ({ ...f, unit: saved.name }))
            showToast('Unit created successfully', 'success')
            setNewUnit('')
            setShowNewUnit(false)
        } catch {
            showToast('Failed to save unit', 'error')
        } finally {
            setSavingUnit(false)
        }
    }
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
        switch (step) {
            case 1: return "Let's Start →"
            case 2: return 'Create Store'
            case 3: return 'Create Warehouse'
            case 4: return 'Add Product'
            case 5: return 'Add Customer'
            case 6: return 'Add Team Member'
            case 7: return 'Go to Dashboard'
            default: return 'Next'
        }
    }

    const inputClass = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm'
    const labelClass = 'block text-sm text-gray-400 mb-1'

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Welcome, {user.business_name || 'there'}!
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Let's get your business set up. We'll walk you through a few quick steps.
                        </p>
                        <div className="text-left space-y-3">
                            {STEP_LABELS.slice(1, 6).map((label, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <span className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 text-xs">
                                        {i + 1}
                                    </span>
                                    <span className="text-gray-300">{label}</span>
                                    {i >= 2 && <span className="text-xs text-gray-600 ml-auto">Optional</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Create Your First Store</h2>
                        <p className="text-gray-400 text-sm mb-6">This is your main point of sale.</p>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Store Name *</label>
                                <input
                                    value={storeForm.name}
                                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                                    placeholder="e.g. Main Branch"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Address</label>
                                <input
                                    value={storeForm.address}
                                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input
                                    value={storeForm.phone}
                                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Create Your First Warehouse</h2>
                        <p className="text-gray-400 text-sm mb-6">Where you'll track your inventory.</p>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Warehouse Name *</label>
                                <input
                                    value={warehouseForm.name}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                                    placeholder="e.g. Main Warehouse"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Address</label>
                                <input
                                    value={warehouseForm.address}
                                    onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Add Your First Product</h2>
                        <p className="text-gray-400 text-sm mb-6">You can always add more later.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Name *</label>
                                <input
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>SKU *</label>
                                <input
                                    value={productForm.sku}
                                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Price *</label>
                                <input
                                    type="number"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
    <label className={labelClass}>Cost Price</label>
    <input
        type="number"
        value={productForm.cost_price ?? ''}
        onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
        placeholder="What you paid for it (optional)"
        className={inputClass}
    />
</div>
                            <div>
    <label className={labelClass}>Unit *</label>
    <div className="flex gap-2">
        <select
            value={productForm.unit}
            onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
            className={`${inputClass} flex-1`}
        >
            {units.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
            ))}
        </select>
        <button
            type="button"
            onClick={() => setShowNewUnit(!showNewUnit)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
        >
            + New
        </button>
    </div>
    {showNewUnit && (
        <div className="flex gap-2 mt-2">
            <input
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="e.g. كرتونة"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveUnit())}
                className={`${inputClass} flex-1 border-blue-500`}
                autoFocus
            />
            <button
                type="button"
                onClick={handleSaveUnit}
                disabled={savingUnit}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs"
            >
                {savingUnit ? '...' : 'Save'}
            </button>
        </div>
    )}
</div>
                            <div className="col-span-2">
    <label className={labelClass}>Initial Quantity</label>
    <input
        type="number"
        min="0"
        value={productForm.quantity}
        onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
        placeholder="0"
        className={inputClass}
    />
</div>
                        </div>
                    </div>
                )

            case 5:
                return (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Add Your First Customer</h2>
                        <p className="text-gray-400 text-sm mb-6">You can always add more later.</p>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Name *</label>
                                <input
                                    value={customerForm.name}
                                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Phone *</label>
                                <input
                                    value={customerForm.phone}
                                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Price Tier</label>
                                <select
                                    value={customerForm.price_tier}
                                    onChange={(e) => setCustomerForm({ ...customerForm, price_tier: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Default</option>
                                    <option value="a">A</option>
                                    <option value="b">B</option>
                                    <option value="c">C</option>
                                    <option value="d">D</option>
                                    <option value="e">E</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )

            case 6:
                return (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Add a Team Member</h2>
                        <p className="text-gray-400 text-sm mb-6">Invite someone to help manage your store.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Name *</label>
                                <input
                                    value={teamForm.name}
                                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email *</label>
                                <input
                                    type="email"
                                    value={teamForm.email}
                                    onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Password *</label>
                                <input
                                    type="password"
                                    value={teamForm.password}
                                    onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Role</label>
                                <select
                                    value={teamForm.role}
                                    onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="store_manager">Store Manager</option>
                                    <option value="store_staff">Store Staff</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )

            case 7:
                return (
                    <div className="text-center">
                        <div className="text-5xl mb-4">&#10003;</div>
                        <h2 className="text-3xl font-bold text-white mb-2">You're All Set!</h2>
                        <p className="text-gray-400">
                            Your business is ready to go. Head to the dashboard to start managing everything.
                        </p>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Step {step} of 7</span>
                        <span>{STEP_LABELS[step - 1]}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 7) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">

                    {renderStep()}

                    {/* Buttons */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={handleBack}
                            disabled={step === 1 || step === 7}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ← Back
                        </button>

                        <div className="flex gap-3">
                            {[4, 5, 6].includes(step) && (
                                <button
                                    onClick={handleSkip}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    Skip
                                </button>
                            )}

                            <button
                                onClick={handleNext}
                                disabled={!canSubmit()}
                                className={`px-6 py-2.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    step === 7
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {loading ? 'Please wait...' : getButtonLabel()}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}