import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const firebaseErrorMap = {
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/popup-closed-by-user': 'Sign-in popup was closed',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method',
}

export default function Signup() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [agreed, setAgreed] = useState(false)
    const { signup, loginWithGoogle, loginWithGithub } = useAuth()
    const navigate = useNavigate()
    useDocumentTitle('Create Account', 'Sign up for AI Interviewer — practice interviews with AI-powered feedback.')

    const handleError = (err) => {
        const msg = firebaseErrorMap[err.code] || err.message
        setError(msg)
    }

    const passwordStrength = () => {
        if (!password) return { score: 0, label: '', color: '' }
        let score = 0
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++
        const levels = [
            { label: 'Weak', color: 'bg-red-500' },
            { label: 'Fair', color: 'bg-amber-500' },
            { label: 'Good', color: 'bg-blue-500' },
            { label: 'Strong', color: 'bg-green-500' },
        ]
        return { score, ...levels[Math.min(score, 4) - 1] || levels[0] }
    }

    const strength = passwordStrength()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!name || !email || !password) {
            setError('Please fill in all fields')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (!agreed) {
            setError('Please accept the terms and conditions')
            return
        }

        setLoading(true)
        try {
            await signup(name, email, password)
            navigate('/')
        } catch (err) {
            handleError(err)
        }
        setLoading(false)
    }

    const handleGoogleSignup = async () => {
        setError('')
        setLoading(true)
        try {
            await loginWithGoogle()
            navigate('/')
        } catch (err) {
            handleError(err)
        }
        setLoading(false)
    }

    const handleGithubSignup = async () => {
        setError('')
        setLoading(true)
        try {
            await loginWithGithub()
            navigate('/')
        } catch (err) {
            handleError(err)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left — Branding Panel */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary-dark flex-col justify-between p-12 text-white">
                {/* Decorative Shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full translate-y-1/3 -translate-x-1/4"></div>
                <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-primary/20 rounded-xl rotate-12"></div>
                <div className="absolute bottom-1/3 left-1/4 w-16 h-16 bg-white/5 rounded-full"></div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <span className="material-icons-round text-primary-light text-xl">psychology</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight">AI Interviewer</span>
                    </div>
                </div>

                {/* Steps */}
                <div className="relative z-10 space-y-10">
                    <h2 className="text-3xl font-bold leading-tight">
                        Get interview-ready<br />in 3 simple steps
                    </h2>
                    <div className="space-y-6">
                        {[
                            { step: '01', title: 'Upload your material', desc: 'Drop a PDF — our AI analyzes it instantly', icon: 'upload_file' },
                            { step: '02', title: 'Configure your session', desc: 'Pick a persona, difficulty, and question types', icon: 'tune' },
                            { step: '03', title: 'Talk to the AI', desc: 'Conversational interview with real-time feedback', icon: 'mic' },
                        ].map(s => (
                            <div key={s.step} className="flex items-start gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                                    <span className="material-icons-round text-primary-light">{s.icon}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-primary-light font-bold tracking-wider mb-1">STEP {s.step}</p>
                                    <h3 className="text-lg font-bold mb-0.5">{s.title}</h3>
                                    <p className="text-sm text-white/50">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-xs text-white/40">© 2026 AI Interviewer. All rights reserved.</p>
                </div>
            </div>

            {/* Right — Signup Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-7">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <span className="material-icons-round text-primary text-xl">psychology</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-900">AI Interviewer</span>
                    </div>

                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900">Create your account</h2>
                        <p className="mt-2 text-slate-500">Start practicing with AI interviews for free</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in slide-in-from-top">
                            <span className="material-icons-round text-lg">error_outline</span>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                            <div className="relative">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <div className="relative">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <span className="material-icons-round text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                            {/* Password Strength */}
                            {password && (
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-slate-200'}`}></div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500">Strength: <span className="font-medium">{strength.label}</span></p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your password"
                                    className={`w-full pl-12 pr-12 py-3.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all bg-white ${confirmPassword && confirmPassword !== password
                                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                        : confirmPassword && confirmPassword === password
                                            ? 'border-green-300 focus:ring-green-200 focus:border-green-400'
                                            : 'border-slate-200 focus:ring-primary/30 focus:border-primary'
                                        }`}
                                    autoComplete="new-password"
                                />
                                {confirmPassword && (
                                    <span className={`material-icons-round absolute right-4 top-1/2 -translate-y-1/2 text-lg ${confirmPassword === password ? 'text-green-500' : 'text-red-400'
                                        }`}>
                                        {confirmPassword === password ? 'check_circle' : 'cancel'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                id="terms"
                                className="mt-1 rounded border-slate-300 text-primary focus:ring-primary/30"
                            />
                            <label htmlFor="terms" className="text-sm text-slate-500 cursor-pointer">
                                I agree to the <span className="text-primary font-medium hover:underline">Terms of Service</span> and{' '}
                                <span className="text-primary font-medium hover:underline">Privacy Policy</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <span className="material-icons-round text-lg">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-slate-50 px-4 text-slate-400 font-medium">or sign up with</span>
                        </div>
                    </div>

                    {/* Social */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleGoogleSignup} disabled={loading} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50">
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Google
                        </button>
                        <button onClick={handleGithubSignup} disabled={loading} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                            GitHub
                        </button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
