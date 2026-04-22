import axios from 'axios'

// Create a single axios instance used by every page in the app.
// Configuring it once here means we don't repeat baseURL or headers everywhere.
const api = axios.create({
    // All requests will be prefixed with this URL.
    // api.get('/products') → http://multidukkan.test/api/products
    baseURL: 'http://multidukkan.test/api',
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

    // Must return config for the request to proceed
    return config
})

// Export so any page can: import api from '../api/axios'
export default api