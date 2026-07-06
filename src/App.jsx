import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from './api/axios'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import CreateProduct from './pages/CreateProduct'
import Customers from './pages/Customers'
import CreateCustomer from './pages/CreateCustomer'
import CreateOrder from './pages/CreateOrder'
import CustomerBalance from './pages/CustomerBalance'
import Inventory from './pages/Inventory'
import Navbar from './components/Navbar'
import Orders from './pages/Orders'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import EditProduct from './pages/EditProduct'
import EditCustomer from './pages/EditCustomer'
import EditSupplier from './pages/EditSupplier'
import Reports from './pages/Reports'
import Suppliers from './pages/Suppliers'
import CreateSupplier from './pages/CreateSupplier'
import SupplierBalance from './pages/SupplierBalance'
import PurchaseOrders from './pages/PurchaseOrders'
import CreatePurchaseOrder from './pages/CreatePurchaseOrder'
import OrderInvoice from './pages/OrderInvoice'
import PurchaseOrderInvoice from './pages/PurchaseOrderInvoice'
import OrderDetail from './pages/OrderDetail'
import PurchaseOrderDetail from './pages/PurchaseOrderDetail'
import ScrollToTop from './components/ScrollToTop'
import { ToastProvider } from './hooks/useToast'
import Toast from './components/Toast'
import ChatWidget from './components/ChatWidget'
import ReportPrint from './pages/ReportPrint'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import GlobalSearch from './components/GlobalSearch'

// Simple auth check — is the user logged in at all?
// Does NOT check has_store here. That's AuthGate's job with fresh data.
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token')
    return token ? children : <Navigate to="/login" />
}

function ChatWidgetGuard() {
    const location = useLocation()

    const hiddenRoutes = [
        '/login',
        '/register',
        '/onboarding',
    ]

    const isInvoicePage =
    location.pathname.endsWith('/invoice') &&
    (location.pathname.startsWith('/orders/') || location.pathname.startsWith('/purchase-orders/')) 
    
    const isReportPrint = location.pathname === '/reports/print'

    if (
        hiddenRoutes.includes(location.pathname) ||
        isInvoicePage ||
        isReportPrint
    ) {
        return null
    }

    return <ChatWidget />
}

// AuthGate runs on every route change.
// Calls /me to get FRESH user data, then decides if new tenant_admin
// needs to be sent to /onboarding. Using fresh data avoids the bug
// where stale localStorage incorrectly redirects existing admins.
function AuthGate({ children }) {
    const navigate = useNavigate()
    const location = useLocation()

   const [searchOpen, setSearchOpen] = useState(false)
    useKeyboardShortcuts({ onSearchOpen: () => setSearchOpen(true) })

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return

        api.get('/me')
            .then(res => {
                const u = res.data
                localStorage.setItem('user', JSON.stringify(u))

                // Don't redirect if already on an auth/onboarding page — prevents infinite loops
                const onAuthPage = ['/login', '/register', '/onboarding'].includes(location.pathname)

                // Only tenant_admin without a store needs the wizard
                if (u.role === 'tenant_admin' && !u.has_store && !onAuthPage) {
                    navigate('/onboarding')
                }
            })
            .catch(() => {
                // Token invalid/expired — clear and send to login
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            })
    }, [location.pathname])

return (
    <>
        {children}
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
)}



export default function App() {
    return (
        <BrowserRouter>
        <ToastProvider>
             <ScrollToTop />
            <AuthGate>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/onboarding" element={
                        <PrivateRoute>
                            <Onboarding />
                        </PrivateRoute>
                    } />
                    <Route path="/" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Dashboard /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Dashboard /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/products" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Products /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/products/:id" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><ProductDetail /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/products/create" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><CreateProduct /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/products/:id/edit" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><EditProduct /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/customers" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Customers /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/customers/create" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><CreateCustomer /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/customers/:id/edit" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><EditCustomer /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/orders" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Orders /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/orders/create" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><CreateOrder /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/orders/:id/invoice" element={
                        <PrivateRoute>
                            <OrderInvoice />
                        </PrivateRoute>
                    } />
                    <Route path="/orders/:id" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><OrderDetail /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/customers/:id/balance" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><CustomerBalance /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/inventory" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Inventory /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/reports" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Reports /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/reports/print" element={
                        <PrivateRoute>
                            <ReportPrint />
                            </PrivateRoute>
                    } />
                    <Route path="/suppliers" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Suppliers /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/suppliers/create" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><CreateSupplier /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/suppliers/:id/balance" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><SupplierBalance /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/suppliers/:id/edit" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><EditSupplier /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/purchase-orders" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><PurchaseOrders /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/purchase-orders/create" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><CreatePurchaseOrder /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/purchase-orders/:id/invoice" element={
                        <PrivateRoute>
                            <PurchaseOrderInvoice />
                        </PrivateRoute>
                    } />
                    <Route path="/purchase-orders/:id" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><PurchaseOrderDetail /></Layout>
                        </PrivateRoute>
                    } />
                    <Route path="/settings" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Settings /></Layout>
                        </PrivateRoute>
                    } />

                </Routes>
                <Toast/>
                <ChatWidgetGuard />
            </AuthGate>
            </ToastProvider>
        </BrowserRouter>
    )
}