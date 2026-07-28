import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useTranslation } from '../i18n/useTranslation'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Register() {
    const [form, setForm] = useState({
        business_name: '',
        name: '',
        email: '',
        password: '',
        password_confirmation: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { t } = useTranslation()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const response = await api.post('/register', form)
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || t('auth.register.createFailed'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#020617]">

            {/* Same aurora background as login */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="blob absolute w-[500px] h-[500px] bg-blue-600/20 top-[-10%] left-[-10%] animate-blob" />
                <div className="blob absolute w-[400px] h-[400px] bg-purple-600/15 top-[20%] right-[-5%] animate-blob-slow" style={{ animationDelay: '2s' }} />
                <div className="blob absolute w-[350px] h-[350px] bg-cyan-500/10 bottom-[-5%] left-[20%] animate-blob-slower" style={{ animationDelay: '4s' }} />
            </div>

            <div className="absolute inset-0 vignette pointer-events-none" />

            {/* ─── Language switcher — fixed corner, visible before sign-up ─── */}
            <div className="fixed top-4 end-4 z-20">
                <LanguageSwitcher />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Multi<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Dukkan</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">{t('auth.register.tagline')}</p>
                </div>

                <div className="glass-card rounded-2xl p-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                {t('auth.register.businessName')}
                            </label>
                            <input
                                value={form.business_name}
                                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                                required
                                placeholder={t('auth.register.businessNamePlaceholder')}
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-slate-700/60 text-white rounded-lg focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 placeholder-slate-500 transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                {t('auth.register.yourName')}
                            </label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder={t('auth.register.yourNamePlaceholder')}
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-slate-700/60 text-white rounded-lg focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 placeholder-slate-500 transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                {t('auth.email')}
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-slate-700/60 text-white rounded-lg focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 placeholder-slate-500 transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                {t('auth.password')}
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-slate-700/60 text-white rounded-lg focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 placeholder-slate-500 transition-all duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                {t('auth.register.confirmPassword')}
                            </label>
                            <input
                                type="password"
                                value={form.password_confirmation}
                                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-slate-700/60 text-white rounded-lg focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 placeholder-slate-500 transition-all duration-200"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 mt-2"
                        >
                            {loading ? t('auth.register.creating') : t('auth.register.submit')}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-6">
                        {t('auth.register.haveAccount')}{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                            {t('auth.logIn')}
                        </Link>
                    </p>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    {t('auth.copyright', { year: new Date().getFullYear() })}
                </p>
            </div>
        </div>
    )
}