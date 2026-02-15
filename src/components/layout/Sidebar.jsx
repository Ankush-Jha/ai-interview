import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
    { to: '/', icon: 'space_dashboard', label: 'Dashboard' },
    { to: '/configure', icon: 'add_circle_outline', label: 'New Interview' },
    { to: '/history', icon: 'history', label: 'History' },
    { to: '/results', icon: 'analytics', label: 'Results' },
]

export default function Sidebar() {
    const { user, logout } = useAuth()

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() || 'U'

    return (
        <aside className="w-[260px] bg-white border-r border-slate-200/80 hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0">
            {/* Logo */}
            <div className="px-6 py-7 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white shadow-md shadow-primary/25">
                    <span className="material-icons-round text-lg">psychology</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">AI Interviewer</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-1 space-y-0.5">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-primary/8 text-primary font-semibold shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`
                        }
                    >
                        <span className="material-icons-round text-[20px]">{item.icon}</span>
                        <span className="text-[13px]">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-3">
                {/* Pro CTA */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-icons-round text-primary text-lg">auto_awesome</span>
                        <h4 className="font-bold text-sm">Go Pro</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4">Unlimited AI interviews, advanced analytics, and priority access.</p>
                    <button className="w-full py-2 bg-primary text-slate-900 text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors">
                        Upgrade Now
                    </button>
                </div>

                {/* Help */}
                <button className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-slate-600 transition-colors text-[13px] w-full rounded-lg hover:bg-slate-50">
                    <span className="material-icons-round text-lg">help_outline</span>
                    Help & Support
                </button>

                {/* User */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {initials}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[13px] font-semibold text-slate-800 truncate">{user?.name || 'User'}</span>
                        <span className="text-[10px] text-slate-400 truncate">{user?.email || 'Free Plan'}</span>
                    </div>
                    <button onClick={logout} className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-white" title="Logout">
                        <span className="material-icons-round text-lg">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
