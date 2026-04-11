import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const response = await api.post('/login', { email, password })
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))
            navigate('/')
        } catch (err) {
            setError('Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#020617]">

            {/* ─── Animated gradient background ─── */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Aurora base gradient */}
                <div
                    className="absolute inset-0 animate-aurora opacity-30"
                    style={{
                        background: 'linear-gradient(135deg, #0c1445 0%, #020617 25%, #0a1628 50%, #0d0b2e 75%, #020617 100%)',
                        backgroundSize: '400% 400%',
                    }}
                />

                {/* Floating gradient blobs */}
                <div className="blob absolute w-[500px] h-[500px] bg-blue-600/20 top-[-10%] left-[-10%] animate-blob" />
                <div className="blob absolute w-[400px] h-[400px] bg-purple-600/15 top-[20%] right-[-5%] animate-blob-slow animation-delay-2000" style={{ animationDelay: '2s' }} />
                <div className="blob absolute w-[350px] h-[350px] bg-cyan-500/10 bottom-[-5%] left-[20%] animate-blob-slower" style={{ animationDelay: '4s' }} />
                <div className="blob absolute w-[300px] h-[300px] bg-indigo-500/15 top-[50%] left-[50%] animate-blob" style={{ animationDelay: '6s' }} />
                <div className="blob absolute w-[250px] h-[250px] bg-violet-500/10 bottom-[20%] right-[15%] animate-blob-slow" style={{ animationDelay: '8s' }} />

                {/* Subtle gradient waves */}
                <div
                    className="absolute inset-0 opacity-20 animate-aurora"
                    style={{
                        background: 'radial-gradient(ellipse at 20% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)',
                        backgroundSize: '200% 200%',
                        animationDuration: '25s',
                    }}
                />
            </div>

            {/* ─── Vignette overlay for depth ─── */}
            <div className="absolute inset-0 vignette pointer-events-none" />

            {/* ─── Noise texture ─── */}
            <div className="absolute inset-0 noise-overlay pointer-events-none" />

            {/* ─── Login content ─── */}
            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Multi<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Dukkan</span>
                    </h1>
                    <h3 className="text-slate-400 mt-2 text-sm">
                        Manage. <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Track</span>. Grow.
                    </h3>
                </div>

                <div className="glass-card rounded-2xl p-8 transition-all duration-300">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} autoComplete="off" className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-slate-700/60 text-white rounded-lg focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 placeholder-slate-500 transition-all duration-200 hover:border-slate-600/80"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-slate-700/60 text-white rounded-lg focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 placeholder-slate-500 transition-all duration-200 hover:border-slate-600/80"
                            />
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign in'}
                        </button>
                        <p className="text-center text-slate-500 text-sm mt-6">
                            Don't have an account? {' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                                Create one
                            </Link>
                        </p>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    &copy; {new Date().getFullYear()} MultiDukkan. All rights reserved.
                </p>
            </div>
        </div>
    )
}