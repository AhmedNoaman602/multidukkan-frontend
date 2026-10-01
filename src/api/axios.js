import axios from 'axios'
import { STORAGE_KEY, DEFAULT_LANG, LANGUAGES } from '../i18n/translate'

// Create a single axios instance used by every page in the app.
// Configuring it once here means we don't repeat baseURL or headers everywhere.
const api = axios.create({
    // All requests will be prefixed with this URL.
    // api.get('/products') → http://multidukkan.test/api/products
    baseURL: 'http://multidukkan.test/api',
    withCredentials: true,
    headers: {
        // Tells the backend we're sending JSON data
        'Content-Type': 'application/json',
        // Tells Laravel to return JSON responses (even on errors)
        // Without this, Laravel may return HTML error pages
        'Accept': 'application/json',
    }
})

// Interceptor: a function that runs automatically BEFORE every request.
// This is how every API call gets the auth token attached without us writing it each time.
api.interceptors.request.use((config) => {
    // Grab the token saved at login time
    const token = localStorage.getItem('token')

    // If we have a token, attach it as "Bearer <token>"
    // Laravel Sanctum reads this header to identify the logged-in user
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    // Tells the backend which language to return error messages in
    const lang = localStorage.getItem(STORAGE_KEY)
    config.headers['X-Locale'] = LANGUAGES.includes(lang) ? lang : DEFAULT_LANG

    // Tells the backend which calendar day "today" is for this viewer, so date
    // filters mean the local day rather than the UTC one. Timestamps themselves
    // stay UTC end to end — this never changes what gets stored or returned.
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (tz) config.headers['X-Timezone'] = tz
    } catch {
        // Older browsers without a resolvable zone fall back to the server default.
    }

    // Must return config for the request to proceed
    return config
})

// Endpoints where a 401 means "wrong credentials", not "your session died".
// The login form shows that error itself — redirecting would replace it with a
// blank login page and the user would never learn what went wrong.
const CREDENTIAL_ENDPOINTS = ['/login', '/register']

// Interceptor: runs after every response. Without this a revoked or expired
// token leaves the user on a page whose requests all fail, because nothing
// notices until AuthGate's next /me on a route change.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status
        const url = error.config?.url ?? ''

        // Matched on the path itself, not a substring: '/settings/login-attempts'
        // must not be mistaken for the login call.
        const requestPath = url.split('?')[0]
        const isCredentialAttempt = CREDENTIAL_ENDPOINTS.some(
            path => requestPath === path || requestPath.endsWith(path)
        )
        const alreadyOnLogin = window.location.pathname === '/login'

        if (status === 401 && !isCredentialAttempt && !alreadyOnLogin) {
            // Same keys handleLogout clears. A full page load rather than a router
            // navigate, so React Query's cache and every component's state go with
            // it — axios lives outside React and has no router or queryClient here.
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('default_store_id')
            sessionStorage.clear()

            window.location.replace('/login')
        }

        // Still rejected, so existing per-page error handling keeps working.
        return Promise.reject(error)
    }
)

// Export so any page can: import api from '../api/axios'
export default api