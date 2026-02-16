import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmail, signInWithGoogle } from '@/lib/auth'

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signInWithEmail(email, password)
            navigate('/', { replace: true })
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign in'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogle() {
        setError('')
        setLoading(true)
        try {
            await signInWithGoogle()
            navigate('/', { replace: true })
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sign in with Google'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto bg-[--neo-primary] border-[3px] border-foreground shadow-hard-sm flex items-center justify-center mb-4">
                        <span className="font-display text-3xl">V</span>
                    </div>
                    <h1 className="font-display text-3xl">WELCOME_BACK</h1>
                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                        Sign in to your Viva account
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="neo-card-sm p-3 border-[--neo-error]" style={{ borderColor: 'var(--neo-error)', boxShadow: '4px 4px 0px 0px var(--neo-error)' }}>
                        <p className="font-mono text-xs text-[--neo-error]">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="font-display text-xs tracking-wider">EMAIL</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="neo-input w-full px-4 py-3 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-display text-xs tracking-wider">PASSWORD</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="neo-input w-full px-4 py-3 text-sm"
                        />
                    </div>

                    <button type="submit" className="btn-neo bg-[--neo-primary] w-full py-3 font-mono text-sm font-bold" disabled={loading}>
                        {loading ? '[SIGNING IN…]' : '[SIGN IN]'}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-[2px] border-foreground" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-background px-3 font-mono text-xs text-muted-foreground uppercase">or</span>
                    </div>
                </div>

                {/* Google */}
                <button
                    className="btn-neo bg-background w-full py-3 font-mono text-sm font-bold flex items-center justify-center gap-2"
                    onClick={handleGoogle}
                    disabled={loading}
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    [CONTINUE WITH GOOGLE]
                </button>

                {/* Footer */}
                <p className="text-center font-mono text-xs text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-bold text-foreground underline">
                        [SIGN UP]
                    </Link>
                </p>
            </div>
        </div>
    )
}
