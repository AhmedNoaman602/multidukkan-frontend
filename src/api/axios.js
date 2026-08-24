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

// Export so any page can: import api from '../api/axios'
export default api