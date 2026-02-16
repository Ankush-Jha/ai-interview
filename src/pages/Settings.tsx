import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
    const { user } = useAuth()
    const navigate = useNavigate()

    async function handleSignOut() {
        await signOut()
        navigate('/login')
    }

    return (
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl">SETTINGS</h1>
                <p className="font-mono text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    Manage your account and preferences
                </p>
            </div>

            <div className="neo-card p-6 space-y-5">
                <h3 className="font-display text-sm">PROFILE</h3>

                <div className="space-y-1">
                    <p className="font-display text-xs tracking-wider text-muted-foreground">NAME</p>
                    <p className="font-mono text-sm">{user?.displayName || 'Not set'}</p>
                </div>

                <div className="border-t-[2px] border-foreground" />

                <div className="space-y-1">
                    <p className="font-display text-xs tracking-wider text-muted-foreground">EMAIL</p>
                    <p className="font-mono text-sm">{user?.email}</p>
                </div>

                <div className="border-t-[2px] border-foreground" />

                <button onClick={handleSignOut} className="btn-neo bg-background px-5 py-2 font-mono text-xs font-bold text-[--neo-error]">
                    [SIGN OUT] ↗
                </button>
            </div>
        </div>
    )
}
