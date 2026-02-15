import { useAuth } from '../../context/AuthContext'

export default function Header() {
    const { user } = useAuth()

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() || 'U'

    return (
        <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50 md:hidden">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white shadow-sm shadow-primary/25">
                    <span className="material-icons-round text-sm">psychology</span>
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">AI Interviewer</span>
            </div>
            <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative">
                    <span className="material-icons-round text-slate-500 text-xl">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {initials}
                </div>
            </div>
        </header>
    )
}
