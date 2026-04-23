import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import logo from '../assets/multidukkan-logo.png'

export default function Navbar() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const handleLogout = async () => {
        try {
            await api.post('/logout')
        } catch (err) {}
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    return (
        <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-1">
                       <span className="text-xl font-bold text-white mr-6">
                            Multi<span className="text-blue-400">Dukkan</span>
                        </span>
                        {[
                            { to: '/dashboard', label: 'Dashboard' },
                            { to: '/products', label: 'Products' },
                            { to: '/customers', label: 'Customers' },
                            { to: '/orders', label: 'Orders' },
                            { to: '/inventory', label: 'Inventory' },
                        ].map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                            >
                                {link.label}
                            </Link>
                            
                        ))}
                        {/* Reports — admin and manager only */}
                        {(user.role === 'tenant_admin') && (
                            <Link to="/reports" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                                Reports
                            </Link>
                        )}
                        {(user.role === 'tenant_admin' || user.role === 'store_manager') && (
                            <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                                Settings
                            </Link>
                        )}
                    </div>

                   <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-medium text-white">{user.business_name}</p>
                            <p className="text-xs text-gray-400">{user.name} · <span className="text-blue-400">{user.role?.replace(/_/g, ' ')}</span></p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-red-600 rounded-md transition-colors text-white"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}