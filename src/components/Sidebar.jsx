import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import LanguageSwitcher from './LanguageSwitcher'
import {
    Menu,
    LayoutDashboard,
    ShoppingCart,
    Users,
    Package,
    Warehouse,
    Wallet,
    ShoppingBag,
    BarChart3,
    Building2,
    History,
    Settings,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet'

const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
    }`

function NavGroup({ title, items, onNavigate }) {
    if (!items.length) return null

    return (
        <div className="mb-6">
            {title && (
                <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {title}
                </p>
            )}
            <div className="flex flex-col gap-1">
                {items.map(item => (
                    <NavLink key={item.to} to={item.to} onClick={onNavigate} className={navLinkClass}>
                        <item.icon size={18} strokeWidth={1.75} className="shrink-0" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    )
}

function Brand() {
    return (
        <span className="text-xl font-bold text-white">
            Multi<span className="text-blue-400">Dukkan</span>
        </span>
    )
}

function UserFooter({ user, onLogout }) {
    const { t } = useTranslation()
    const roleLabel = user.role ? t(`enums.role.${user.role}`) : ''

    return (
        <div className="border-t border-gray-800 p-4 shrink-0">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.business_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                        {user.name} · <span className="text-blue-400">{roleLabel}</span>
                    </p>
                </div>
            </div>
            <LanguageSwitcher />
            <button
                onClick={onLogout}
                className="w-full px-3 py-1.5 text-sm bg-gray-700 hover:bg-red-600 rounded-md transition-colors text-white"
            >
                {t('navigation.logout')}
            </button>
        </div>
    )
}

export default function Sidebar() {
    const navigate = useNavigate()
    const { t, dir } = useTranslation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const handleLogout = async () => {
        try {
            await api.post('/logout')
        } catch (err) {}
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    const canSeeExpenses = user.role === 'tenant_admin' || user.role === 'store_manager'
    const canSeeReports = user.role === 'tenant_admin'
    const canSeeAuditLog = user.role === 'tenant_admin'
    const canSeeSettings = user.role === 'tenant_admin' || user.role === 'store_manager'

    const groups = [
        { title: null, items: [
            { to: '/dashboard', label: t('navigation.dashboard'), icon: LayoutDashboard },
        ] },
        { title: t('navigation.groups.operations'), items: [
            { to: '/orders', label: t('navigation.orders'), icon: ShoppingCart },
            { to: '/customers', label: t('navigation.customers'), icon: Users },
            { to: '/products', label: t('navigation.products'), icon: Package },
            { to: '/inventory', label: t('navigation.inventory'), icon: Warehouse },
        ] },
        { title: t('navigation.groups.finance'), items: [
            ...(canSeeExpenses ? [{ to: '/expenses', label: t('navigation.expenses'), icon: Wallet }] : []),
            { to: '/purchase-orders', label: t('navigation.purchaseOrders'), icon: ShoppingBag },
            ...(canSeeReports ? [{ to: '/reports', label: t('navigation.reports'), icon: BarChart3 }] : []),
        ] },
        { title: t('navigation.groups.suppliers'), items: [
            { to: '/suppliers', label: t('navigation.suppliers'), icon: Building2 },
        ] },
        { title: t('navigation.groups.system'), items: [
            ...(canSeeAuditLog ? [{ to: '/audit-log', label: t('navigation.auditLog'), icon: History }] : []),
            ...(canSeeSettings ? [{ to: '/settings', label: t('navigation.settings'), icon: Settings }] : []),
        ] },
    ]

    return (
        <>
            {/* Desktop sidebar — fixed full height, hidden below lg */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:start-0 lg:w-64 bg-gray-900 border-e border-gray-800 z-30">
                <div className="h-16 flex items-center px-4 border-b border-gray-800 shrink-0">
                    <Brand />
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    {groups.map((group, i) => (
                        <NavGroup key={i} title={group.title} items={group.items} />
                    ))}
                </nav>
                <UserFooter user={user} onLogout={handleLogout} />
            </aside>

            {/* Mobile top bar — sticky, in normal flow, hidden at lg and up */}
            <div className="lg:hidden sticky top-0 z-40 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-3 h-14 px-4">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="text-white p-2 -ms-2"
                        aria-label={t('navigation.openMenu')}
                    >
                        <Menu size={22} />
                    </button>
                    <Brand />
                </div>
            </div>

            {/* Mobile off-canvas nav drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="bg-gray-900 border-gray-800 text-white p-0 w-72 flex flex-col gap-0">
                    <SheetHeader className="h-16 flex flex-row items-center px-4 border-b border-gray-800 space-y-0">
                        <SheetTitle className="text-white">
                            <Brand />
                        </SheetTitle>
                    </SheetHeader>
                    <nav className="flex-1 overflow-y-auto px-3 py-4">
                        {groups.map((group, i) => (
                            <NavGroup
                                key={i}
                                title={group.title}
                                items={group.items}
                                onNavigate={() => setMobileOpen(false)}
                            />
                        ))}
                    </nav>
                    <UserFooter user={user} onLogout={handleLogout} />
                </SheetContent>
            </Sheet>
        </>
    )
}
