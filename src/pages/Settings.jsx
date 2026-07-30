import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../hooks/useToast'
import DeleteModal from '../components/DeleteModal'
import Modal from '../components/Modal'
import { useTranslation } from '../i18n/useTranslation'

export default function Settings() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('users')
    const [users, setUsers] = useState([])
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateUser, setShowCreateUser] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showCreateStore, setShowCreateStore] = useState(false)
    const [storeForm, setStoreForm] = useState({ name: '', address: '', phone: '' })
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const navigate = useNavigate()
    const [warehouses, setWarehouses] = useState([])
    const [showCreateWarehouse, setShowCreateWarehouse] = useState(false)
    const [warehouseForm, setWarehouseForm] = useState({
        name: '',
        address: '',
        store_id: user.role === 'store_manager' ? user.store_id : ''
    })
    const [userForm, setUserForm] = useState({
        name: '', email: '', password: '', role: 'store_staff', store_id: ''
    })

    const [units, setUnits] = useState([])
    const [showCreateUnit, setShowCreateUnit] = useState(false)
    const [unitForm, setUnitForm] = useState({ name: '' })
    const [deleteTargetUser, setDeleteTargetUser] = useState(null)
    const [deletingUser, setDeletingUser] = useState(false)
    const [deleteTargetStore, setDeleteTargetStore] = useState(null)
    const [deletingStore, setDeletingStore] = useState(false)
    const [deleteTargetWarehouse, setDeleteTargetWarehouse] = useState(null)
    const [deletingWarehouse, setDeletingWarehouse] = useState(false)
    const [deleteTargetUnit, setDeleteTargetUnit] = useState(null)
    const [deletingUnit, setDeletingUnit] = useState(false)
    const { showToast } = useToast()

    const allowedRoles = user.role === 'tenant_admin'
        ? ['store_manager', 'store_staff']
        : ['store_staff']

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, storesRes, warehousesRes , unitsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/stores'),
                    api.get('/warehouses'),
                    api.get('/units'),
                ])
                setUsers(usersRes.data.data)
                setStores(storesRes.data.data)
                setWarehouses(warehousesRes.data.data)
                setUnits(unitsRes.data.data)
            } catch (err) {
                showToast(t('settings.loadFailed'), 'error')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleCreateUser = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await api.post('/users', userForm)
            setUsers([...users, res.data.data])
            setUserForm({ name: '', email: '', password: '', role: 'store_staff', store_id: '' })
            showToast(t('settings.users.created'), 'success')
            setShowCreateUser(false)
        } catch (err) {
            showToast(err.response?.data?.message || t('settings.users.createFailed'), 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteUser = async () => {
    if (!deleteTargetUser) return
    setDeletingUser(true)
    try {
        await api.delete(`/users/${deleteTargetUser.id}`)
        setUsers(users.filter(u => u.id !== deleteTargetUser.id))
        showToast(t('settings.users.deleted'), 'success')
        setDeleteTargetUser(null)
    } catch (err) {
        showToast(err.response?.data?.message || t('settings.users.deleteFailed'), 'error')
        setDeleteTargetUser(null)
    } finally {
        setDeletingUser(false)
    }
}

    const handleCreateStore = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
        const res = await api.post('/stores', storeForm)
        setStores([...stores, res.data.data])
        setStoreForm({ name: '', address: '', phone: '' })
        showToast(t('settings.stores.created'), 'success')
        setShowCreateStore(false)
    } catch (err) {
    showToast(err.response?.data?.message || t('settings.stores.createFailed'), 'error')
}finally {
        setSaving(false)
    }
}

const handleDeleteStore = async () => {
    if (!deleteTargetStore) return
    setDeletingStore(true)
    try {
        await api.delete(`/stores/${deleteTargetStore.id}`)
        setStores(stores.filter(s => s.id !== deleteTargetStore.id))
        showToast(t('settings.stores.deleted'), 'success')
        setDeleteTargetStore(null)
    } catch (err) {
        showToast(err.response?.data?.message || t('settings.stores.deleteFailed'), 'error')
        setDeleteTargetStore(null)
    } finally {
        setDeletingStore(false)
    }
}


const handleCreateWarehouse = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
        const res = await api.post('/warehouses', warehouseForm)
        setWarehouses([...warehouses, res.data.data])
        setWarehouseForm({ name: '', address: '', store_id: '' })
        showToast(t('settings.warehouses.created'), 'success')
        setShowCreateWarehouse(false)
    } catch (err) {
        showToast(err.response?.data?.message || t('settings.warehouses.createFailed'), 'error')
    } finally {
        setSaving(false)
    }
}

const handleDeleteWarehouse = async () => {
    if (!deleteTargetWarehouse) return
    setDeletingWarehouse(true)
    try {
        await api.delete(`/warehouses/${deleteTargetWarehouse.id}`)
        setWarehouses(warehouses.filter(w => w.id !== deleteTargetWarehouse.id))
        showToast(t('settings.warehouses.deleted'), 'success')
        setDeleteTargetWarehouse(null)
    } catch (err) {
        showToast(err.response?.data?.message || t('settings.warehouses.deleteFailed'), 'error')
        setDeleteTargetWarehouse(null)
    } finally {
        setDeletingWarehouse(false)
    }
}

const handleCreateUnit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
        const res = await api.post('/units', unitForm)
        setUnits([...units, res.data.data])
        setUnitForm({ name: '' })
        showToast(t('products.form.unitCreated'), 'success')
        setShowCreateUnit(false)
    } catch (err) {
        showToast(err.response?.data?.message || t('settings.units.createFailed'), 'error')
    } finally {
        setSaving(false)
    }
}

const handleDeleteUnit = async () => {
    if (!deleteTargetUnit) return
    setDeletingUnit(true)
    try {
        await api.delete(`/units/${deleteTargetUnit.id}`)
        setUnits(units.filter(u => u.id !== deleteTargetUnit.id))
        showToast(t('settings.units.deleted'), 'success')
        setDeleteTargetUnit(null)
    } catch (err) {
        showToast(err.response?.data?.message || t('settings.units.deleteFailed'), 'error')
        setDeleteTargetUnit(null)
    } finally {
        setDeletingUnit(false)
    }
}

    if (loading) return <LoadingSpinner />

    const roleColors = {
        tenant_admin: 'bg-purple-500/20 text-purple-400',
        store_manager: 'bg-blue-500/20 text-blue-400',
        store_staff: 'bg-gray-500/20 text-gray-400',
    }

    return (
    <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-48 shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 flex md:block gap-1 overflow-x-auto md:sticky md:top-6">
                <p className="hidden md:block text-xs text-gray-500 uppercase tracking-wider px-3 py-2">{t('settings.title')}</p>
                {[
                    ...(user.role === 'tenant_admin' ? [
                        { key: 'stores', label: t('settings.tabs.stores'), icon: '🏪' },
                    ] : []),
                    { key: 'users', label: t('settings.tabs.users'), icon: '👥' },
                    { key: 'warehouses', label: t('settings.tabs.warehouses'), icon: '🏭' },
                    { key: 'units', label: t('settings.tabs.units'), icon: '📦' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`w-full md:w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-start whitespace-nowrap ${
                            activeTab === tab.key
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        }`}
                    >
                        <span className="text-base">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-6">{t('settings.title')}</h2>

            {/* Users tab */}
            {activeTab === 'users' && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <h3 className="text-white font-semibold">{t('settings.users.teamMembers')}</h3>
                        <button
                            onClick={() => setShowCreateUser(!showCreateUser)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {showCreateUser ? t('common.cancel') : t('settings.users.addUser')}
                        </button>
                    </div>

                    {showCreateUser && (
                        <Modal open={showCreateUser} onClose={() => setShowCreateUser(false)} title={t('settings.users.newTeamMember')}>
                            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('common.name')}</label>
                                    <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('auth.email')}</label>
                                    <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('auth.password')}</label>
                                    <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('settings.users.role')}</label>
                                    <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm">
                                        {allowedRoles.map(role => (
                                            <option key={role} value={role}>{t(`enums.role.${role}`)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">{t('common.store')} <span className="text-red-400">*</span></label>
                                    <select value={userForm.store_id} onChange={(e) => setUserForm({ ...userForm, store_id: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm">
                                        <option value="">{t('orders.create.chooseStore')}</option>
                                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                        {saving ? t('orders.create.creating') : t('settings.users.createUser')}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )}

                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>
                                    {['common.name', 'auth.email', 'settings.users.role', 'common.store', 'common.actions'].map(key => (
                                        <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{t(key)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white text-sm font-medium">{u.name}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[u.role]}`}>{t(`enums.role.${u.role}`)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{stores.find(s => s.id === parseInt(u.store_id))?.name || '—'}</td>
                                        <td className="px-4 py-3">
                                            {allowedRoles.includes(u.role) && (
                                                <button onClick={() => setDeleteTargetUser(u)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">{t('suppliers.balance.remove')}</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <div className="text-center py-16 text-gray-500">{t('settings.users.empty')}</div>}
                    </div>
                    <DeleteModal
                       open={!!deleteTargetUser}
                       onClose={() => setDeleteTargetUser(null)}
                       onConfirm={handleDeleteUser}
                       deleting={deletingUser}
                       title={t('settings.users.deleteUser')}
                       name={deleteTargetUser?.name}
                       warning={t('settings.users.deleteWarning')}
                    />
                </div>
            )}

            {/* Stores tab */}
            {activeTab === 'stores' && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <h3 className="text-white font-semibold">{t('settings.tabs.stores')}</h3>
                        <button onClick={() => setShowCreateStore(!showCreateStore)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            {showCreateStore ? t('common.cancel') : t('settings.stores.addStore')}
                        </button>
                    </div>
                    {showCreateStore && (
                        <Modal open={showCreateStore} onClose={() => setShowCreateStore(false)} title={t('settings.stores.newStore')}>
                            <form onSubmit={handleCreateStore} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('settings.stores.storeNameRequired')}</label>
                                    <input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('common.phone')}</label>
                                    <input value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">{t('common.address')}</label>
                                    <input value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                        {saving ? t('orders.create.creating') : t('settings.stores.createStore')}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>{['common.name', 'common.address', 'common.phone', 'common.actions'].map(key => <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{t(key)}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {stores.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white text-sm font-medium">{s.name}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{s.address || '—'}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{s.phone || '—'}</td>
                                        <td className="px-4 py-3">
                                            {stores.length > 1 && (
                                                <button onClick={() => setDeleteTargetStore(s)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">{t('common.delete')}</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {stores.length === 0 && <div className="text-center py-16 text-gray-500">{t('settings.stores.empty')}</div>}
                    </div>
                    <DeleteModal
                        open={!!deleteTargetStore}
                        onClose={() => setDeleteTargetStore(null)}
                        onConfirm={handleDeleteStore}
                        deleting={deletingStore}
                        title={t('settings.stores.deleteStore')}
                        name={deleteTargetStore?.name}
                        warning={t('settings.stores.deleteWarning')}
/>
                </div>
            )}

            {/* Warehouses tab */}
            {activeTab === 'warehouses' && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <h3 className="text-white font-semibold">{t('settings.tabs.warehouses')}</h3>
                        <button onClick={() => setShowCreateWarehouse(!showCreateWarehouse)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            {showCreateWarehouse ? t('common.cancel') : t('settings.warehouses.addWarehouse')}
                        </button>
                    </div>
                    {showCreateWarehouse && (
                        <Modal open={showCreateWarehouse} onClose={() => setShowCreateWarehouse(false)} title={t('settings.warehouses.newWarehouse')}>
                            <form onSubmit={handleCreateWarehouse} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('settings.warehouses.warehouseName')}</label>
                                    <input value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('common.store')}</label>
                                    {user.role === 'tenant_admin' ? (
                                        <select value={warehouseForm.store_id} onChange={(e) => setWarehouseForm({ ...warehouseForm, store_id: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm">
                                            <option value="">{t('orders.create.chooseStore')}</option>
                                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    ) : (
                                        <div className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 text-gray-400 rounded-lg text-sm">
                                            {stores.find(s => s.id === parseInt(user.store_id))?.name || t('settings.warehouses.yourStore')}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">{t('common.address')}</label>
                                    <input value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                        {saving ? t('orders.create.creating') : t('settings.warehouses.createWarehouse')}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>{['common.name', 'common.store', 'common.address', 'common.actions'].map(key => <th key={key} className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{t(key)}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {warehouses.map(w => (
                                    <tr key={w.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white text-sm font-medium">{w.name}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{stores.find(s => s.id === parseInt(w.store_id))?.name || '—'}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{w.address || '—'}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setDeleteTargetWarehouse(w)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">{t('common.delete')}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {warehouses.length === 0 && <div className="text-center py-16 text-gray-500">{t('settings.warehouses.empty')}</div>}
                    </div>
                    <DeleteModal
    open={!!deleteTargetWarehouse}
    onClose={() => setDeleteTargetWarehouse(null)}
    onConfirm={handleDeleteWarehouse}
    deleting={deletingWarehouse}
    title={t('settings.warehouses.deleteWarehouse')}
    name={deleteTargetWarehouse?.name}
    warning={t('settings.warehouses.deleteWarning')}
/>

                </div>

            )}


            {/* Units tab */}
            {activeTab === 'units' && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <h3 className="text-white font-semibold">{t('settings.tabs.units')}</h3>
                        <button onClick={() => setShowCreateUnit(!showCreateUnit)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            {showCreateUnit ? t('common.cancel') : t('settings.units.addUnit')}
                        </button>
                    </div>
                    {showCreateUnit && (
                        <Modal open={showCreateUnit} onClose={() => setShowCreateUnit(false)} title={t('settings.units.newUnit')}>
                            <form onSubmit={handleCreateUnit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">{t('settings.units.unitName')}</label>
                                    <input
                                        value={unitForm.name}
                                        onChange={(e) => setUnitForm({ name: e.target.value })}
                                        required
                                        placeholder={t('settings.units.unitNamePlaceholder')}
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                    {saving ? t('orders.create.creating') : t('settings.units.addUnitSubmit')}
                                </button>
                            </form>
                        </Modal>
                    )}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{t('settings.units.unitName')}</th>
                                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase tracking-wider">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {units.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white text-sm font-medium">{u.name}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setDeleteTargetUnit(u)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">{t('common.delete')}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {units.length === 0 && <div className="text-center py-16 text-gray-500">{t('settings.units.empty')}</div>}
                    </div>
                </div>
            )}
           <DeleteModal
                open={!!deleteTargetUnit}
                onClose={() => setDeleteTargetUnit(null)}
                onConfirm={handleDeleteUnit}
                deleting={deletingUnit}
                title={t('settings.units.deleteUnit')}
                name={deleteTargetUnit?.name}
            />
        </div>
    </div>
)
}
