import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import api from './api/axios'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
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

// Simple auth check — is the user logged in at all?
// Does NOT check has_store here. That's AuthGate's job with fresh data.
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token')
    return token ? children : <Navigate to="/login" />
}

// AuthGate runs on every route change.
// Calls /me to get FRESH user data, then decides if new tenant_admin
// needs to be sent to /onboarding. Using fresh data avoids the bug
// where stale localStorage incorrectly redirects existing admins.
function AuthGate({ children }) {
    const navigate = useNavigate()
    const location = useLocation()

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

    return children
}

export default function App() {
    return (
        <BrowserRouter>
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
                    <Route path="/settings" element={
                        <PrivateRoute>
                            <Navbar />
                            <Layout><Settings /></Layout>
                        </PrivateRoute>
                    } />
                </Routes>
            </AuthGate>
        </BrowserRouter>
    )
}