import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'

export default function Settings() {
    const [activeTab, setActiveTab] = useState('users')
    const [users, setUsers] = useState([])
    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateUser, setShowCreateUser] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
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
                setError('Failed to load data')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleCreateUser = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            const res = await api.post('/users', userForm)
            setUsers([...users, res.data.data])
            setUserForm({ name: '', email: '', password: '', role: 'store_staff', store_id: '' })
            setSuccess('User created successfully')
            setTimeout(() => setSuccess(''), 3000)
            setShowCreateUser(false)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return
        try {
            await api.delete(`/users/${userId}`)
            setUsers(users.filter(u => u.id !== userId))
            setSuccess('User deleted')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user')
        }
    }

    const handleCreateStore = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
        const res = await api.post('/stores', storeForm)
        setStores([...stores, res.data.data])
        setStoreForm({ name: '', address: '', phone: '' })
        setSuccess('Store created successfully')
        setTimeout(() => setSuccess(''), 3000)
        setShowCreateStore(false)
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to create store')
    } finally {
        setSaving(false)
    }
}

const handleDeleteStore = async (storeId) => {
    if (!confirm('Are you sure you want to delete this store?')) return
    try {
        await api.delete(`/stores/${storeId}`)
        setStores(stores.filter(s => s.id !== storeId))
        setSuccess('Store deleted')
        setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete store')
    }
}


const handleCreateWarehouse = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
        const res = await api.post('/warehouses', warehouseForm)
        setWarehouses([...warehouses, res.data.data])
        setWarehouseForm({ name: '', address: '', store_id: '' })
        setSuccess('Warehouse created successfully')
        setTimeout(() => setSuccess(''), 3000)
        setShowCreateWarehouse(false)
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to create warehouse')
    } finally {
        setSaving(false)
    }
}

const handleDeleteWarehouse = async (warehouseId) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return
    try {
        await api.delete(`/warehouses/${warehouseId}`)
        setWarehouses(warehouses.filter(w => w.id !== warehouseId))
        setSuccess('Warehouse deleted')
        setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete warehouse')
    }
}

const handleCreateUnit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
        const res = await api.post('/units', unitForm)
        setUnits([...units, res.data.data])
        setUnitForm({ name: '' })
        setSuccess('Unit created successfully')
        setTimeout(() => setSuccess(''), 3000)
        setShowCreateUnit(false)
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to create unit')
    } finally {
        setSaving(false)
    }
}

const handleDeleteUnit = async (unitId) => {
    if (!confirm('Are you sure you want to delete this unit?')) return
    try {
        await api.delete(`/units/${unitId}`)
        setUnits(units.filter(u => u.id !== unitId))
        setSuccess('Unit deleted')
        setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete unit')
    }
}
    
    if (loading) return <LoadingSpinner />

    const roleColors = {
        tenant_admin: 'bg-purple-500/20 text-purple-400',
        store_manager: 'bg-blue-500/20 text-blue-400',
        store_staff: 'bg-gray-500/20 text-gray-400',
    }

    return (
    <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 sticky top-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">Settings</p>
                {[
                    ...(user.role === 'tenant_admin' ? [
                        { key: 'stores', label: 'Stores', icon: '🏪' },
                    ] : []),
                    { key: 'users', label: 'Users & Roles', icon: '👥' },
                    { key: 'warehouses', label: 'Warehouses', icon: '🏭' },
                    { key: 'units', label: 'Units', icon: '📦' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
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
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">
                    {success}
                </div>
            )}

            {/* Users tab */}
            {activeTab === 'users' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Team Members</h3>
                        <button
                            onClick={() => setShowCreateUser(!showCreateUser)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {showCreateUser ? 'Cancel' : '+ Add User'}
                        </button>
                    </div>

                    {showCreateUser && (
                        <Modal open={showCreateUser} onClose={() => setShowCreateUser(false)} error={error} title="New Team Member">
                            <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                                    <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                                    <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Password</label>
                                    <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Role</label>
                                    <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm">
                                        {allowedRoles.map(role => (
                                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Store <span className="text-red-400">*</span></label>
                                    <select value={userForm.store_id} onChange={(e) => setUserForm({ ...userForm, store_id: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm">
                                        <option value="">Select a store</option>
                                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                        {saving ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )}

                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>
                                    {['Name', 'Email', 'Role', 'Store', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white text-sm font-medium">{u.name}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[u.role]}`}>{u.role.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{stores.find(s => s.id === parseInt(u.store_id))?.name || '—'}</td>
                                        <td className="px-4 py-3">
                                            {allowedRoles.includes(u.role) && (
                                                <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">Remove</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <div className="text-center py-16 text-gray-500">No team members yet.</div>}
                    </div>
                </div>
            )}

            {/* Stores tab */}
            {activeTab === 'stores' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Stores</h3>
                        <button onClick={() => setShowCreateStore(!showCreateStore)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            {showCreateStore ? 'Cancel' : '+ Add Store'}
                        </button>
                    </div>
                    {showCreateStore && (
                        <Modal open={showCreateStore} onClose={() => setShowCreateStore(false)} error={error} title="New Store">
                            <form onSubmit={handleCreateStore} className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Store Name</label>
                                    <input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Phone *</label>
                                    <input value={storeForm.phone} onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Address *</label>
                                    <input value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                        {saving ? 'Creating...' : 'Create Store'}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>{['Name', 'Address', 'Phone', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {stores.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white text-sm font-medium">{s.name}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{s.address || '—'}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{s.phone || '—'}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => handleDeleteStore(s.id)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {stores.length === 0 && <div className="text-center py-16 text-gray-500">No stores yet.</div>}
                    </div>
                </div>
            )}

            {/* Warehouses tab */}
            {activeTab === 'warehouses' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Warehouses</h3>
                        <button onClick={() => setShowCreateWarehouse(!showCreateWarehouse)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            {showCreateWarehouse ? 'Cancel' : '+ Add Warehouse'}
                        </button>
                    </div>
                    {showCreateWarehouse && (
                        <Modal open={showCreateWarehouse} onClose={() => setShowCreateWarehouse(false)} error={error} title="New Warehouse">
                            <form onSubmit={handleCreateWarehouse} className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Warehouse Name</label>
                                    <input value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Store</label>
                                    {user.role === 'tenant_admin' ? (
                                        <select value={warehouseForm.store_id} onChange={(e) => setWarehouseForm({ ...warehouseForm, store_id: e.target.value })} required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm">
                                            <option value="">Select a store</option>
                                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    ) : (
                                        <div className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 text-gray-400 rounded-lg text-sm">
                                            {stores.find(s => s.id === parseInt(user.store_id))?.name || 'Your store'}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Address</label>
                                    <input value={warehouseForm.address} onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                        {saving ? 'Creating...' : 'Create Warehouse'}
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    )}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>{['Name', 'Store', 'Address', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {warehouses.map(w => (
                                    <tr key={w.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white text-sm font-medium">{w.name}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{stores.find(s => s.id === parseInt(w.store_id))?.name || '—'}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">{w.address || '—'}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => handleDeleteWarehouse(w.id)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {warehouses.length === 0 && <div className="text-center py-16 text-gray-500">No warehouses yet.</div>}
                    </div>
                </div>
            )}

            {/* Units tab */}
            {activeTab === 'units' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Units</h3>
                        <button onClick={() => setShowCreateUnit(!showCreateUnit)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            {showCreateUnit ? 'Cancel' : '+ Add Unit'}
                        </button>
                    </div>
                    {showCreateUnit && (
                        <Modal open={showCreateUnit} onClose={() => setShowCreateUnit(false)} error={error} title="New Unit">
                            <form onSubmit={handleCreateUnit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Unit Name</label>
                                    <input
                                        value={unitForm.name}
                                        onChange={(e) => setUnitForm({ name: e.target.value })}
                                        required
                                        placeholder="e.g. متر، كيلو، علبة"
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                                    {saving ? 'Creating...' : 'Add Unit'}
                                </button>
                            </form>
                        </Modal>
                    )}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unit Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {units.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white text-sm font-medium">{u.name}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => handleDeleteUnit(u.id)} className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {units.length === 0 && <div className="text-center py-16 text-gray-500">No units yet.</div>}
                    </div>
                </div>
            )}
        </div>
    </div>
)
}