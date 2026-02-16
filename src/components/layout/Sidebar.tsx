import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { cn } from '@/lib/utils'

const navItems = [
    { to: '/', label: 'DASHBOARD', icon: '⌂' },
    { to: '/configure', label: 'NEW INTERVIEW', icon: '+' },
    { to: '/history', label: 'HISTORY', icon: '↻' },
    { to: '/settings', label: 'SETTINGS', icon: '⚙' },
]

interface SidebarProps {
    onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
    const { user } = useAuth()
    const navigate = useNavigate()

    async function handleSignOut() {
        await signOut()
        navigate('/login')
    }

    return (
        <div className="flex h-full flex-col bg-card border-r-[3px] border-foreground">
            {/* Logo */}
            <div className="px-5 py-5 border-b-[3px] border-foreground">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[--neo-primary] border-[3px] border-foreground shadow-hard-xs flex items-center justify-center">
                        <span className="font-display text-xl text-foreground">V</span>
                    </div>
                    <span className="font-display text-xl tracking-tight">VIVA</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-2">
                {navItems.map(({ to, label, icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold tracking-wider transition-all',
                                isActive
                                    ? 'bg-[--neo-primary] border-[3px] border-foreground shadow-hard-xs'
                                    : 'border-[3px] border-transparent hover:border-foreground hover:bg-muted'
                            )
                        }
                    >
                        <span className="text-base">{icon}</span>
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User */}
            <div className="border-t-[3px] border-foreground p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[--neo-primary] border-[2px] border-foreground flex items-center justify-center font-display text-sm">
                        {(user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
                            {user?.displayName || 'User'}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground truncate">
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="btn-neo w-full py-2 px-3 bg-background text-xs font-mono font-bold tracking-wider"
                >
                    [SIGN OUT]
                </button>
            </div>
        </div>
    )
}
