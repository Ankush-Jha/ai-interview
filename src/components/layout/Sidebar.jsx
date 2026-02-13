import { NavLink } from 'react-router-dom'

const navItems = [
    { to: '/', icon: 'dashboard', label: 'Dashboard' },
    { to: '/configure', icon: 'add_circle_outline', label: 'New Interview' },
    { to: '/history', icon: 'history', label: 'History' },
    { to: '/results', icon: 'analytics', label: 'Results' },
]

export default function Sidebar() {
    return (
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <span className="material-icons-round text-lg">psychology</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">AI Interviewer</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group ${isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`
                        }
                    >
                        <span className="material-icons-round text-[22px]">{item.icon}</span>
                        <span className="text-sm">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Pro CTA */}
            <div className="p-4 space-y-4">
                <div className="bg-gradient-to-br from-primary to-primary-dark p-4 rounded-xl text-white shadow-lg shadow-primary/20">
                    <h4 className="font-bold text-sm mb-1">Go Pro</h4>
                    <p className="text-xs opacity-90 mb-3">Unlock unlimited AI interview sessions and custom PDF uploads.</p>
                    <button className="w-full py-2 bg-white text-primary text-xs font-bold rounded-lg hover:bg-opacity-90 transition-colors">
                        Upgrade Now
                    </button>
                </div>

                {/* Help */}
                <button className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-primary transition-colors text-sm w-full">
                    <span className="material-icons-round text-lg">help_outline</span>
                    Help & Support
                </button>

                {/* User */}
                <div className="flex items-center gap-3 px-4 py-2 border-t border-slate-100 pt-4">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        AJ
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">Ankit Jakhar</span>
                        <span className="text-xs text-slate-500">Free Plan</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
