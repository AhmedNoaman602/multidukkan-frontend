import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../api/axios'

export default function Navbar() {
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const handleLogout = async () => {
        try {
            await api.post('/logout')
        } catch (err) {}
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    const baseLinks = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/products', label: 'Products' },
        { to: '/customers', label: 'Customers' },
        { to: '/orders', label: 'Orders' },
        { to: '/inventory', label: 'Inventory' },
        { to: '/suppliers', label: 'Suppliers' },
        { to: '/purchase-orders', label: 'Purchases' },
    ]

    const links = [
        ...baseLinks,
        ...(user.role === 'tenant_admin' ? [{ to: '/reports', label: 'Reports' }] : []),
        ...(user.role === 'tenant_admin' ? [{ to: '/audit-log', label: 'Activity' }] : []),
        ...(user.role === 'tenant_admin' || user.role === 'store_manager' ? [{ to: '/settings', label: 'Settings' }] : []),
    ]

    const linkClass = ({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`

    return (
       <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50 relative">
    <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-white me-6">
                    Multi<span className="text-blue-400">Dukkan</span>
                </span>

                {/* Desktop links — hidden on mobile */}
                <div className="hidden lg:flex items-center gap-1">
                    {links.map(link => (
                        <NavLink key={link.to} to={link.to} className={linkClass}>
                            {link.label}
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-3">
                    <div className="text-end">
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

                {/* Hamburger — mobile only */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden text-white p-2"
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </div>
        </div>
    </div>

    {/* Mobile menu panel */}
    {isMenuOpen && (
        <div className="lg:hidden absolute top-16 inset-x-0 bg-gray-900 border-t border-gray-800 flex flex-col p-4 gap-1">
            {links.map(link => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={linkClass}
                >
                    {link.label}
                </NavLink>
            ))}

            <div className="mt-2 pt-3 border-t border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-white">{user.business_name}</p>
                    <p className="text-xs text-gray-400">{user.name} · <span className="text-blue-400">{user.role?.replace(/_/g, ' ')}</span></p>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="mt-2 px-3 py-2 text-sm bg-gray-700 hover:bg-red-600 rounded-md transition-colors text-white text-start"
            >
                Logout
            </button>
        </div>
    )}
</nav>
    )
}