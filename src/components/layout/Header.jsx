export default function Header() {
    return (
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-50 md:hidden">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <span className="material-icons-round text-sm">psychology</span>
                </div>
                <span className="font-bold text-lg tracking-tight">AI Interviewer</span>
            </div>
            <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
                    <span className="material-icons-round text-slate-600">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                    AJ
                </div>
            </div>
        </header>
    )
}
