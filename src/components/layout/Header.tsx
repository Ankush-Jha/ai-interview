import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const routeTitles: Record<string, string> = {
    '/': 'DASHBOARD',
    '/configure': 'NEW INTERVIEW',
    '/history': 'HISTORY',
    '/settings': 'SETTINGS',
}

interface HeaderProps {
    onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth()
    const location = useLocation()
    const title = routeTitles[location.pathname] || 'VIVA'

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b-[3px] border-foreground bg-card px-4 lg:px-6">
            {/* Mobile menu */}
            <button
                className="lg:hidden neo-border-thin p-1 hover:bg-[--neo-primary] transition-colors"
                onClick={onMenuClick}
            >
                <span className="text-lg font-bold">☰</span>
                <span className="sr-only">Toggle menu</span>
            </button>

            {/* Page title */}
            <h1 className="font-display text-lg tracking-tight">{title}</h1>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Recording indicator */}
            <div className="hidden lg:flex items-center gap-2">
                <div className="flex gap-1 h-4 items-end">
                    <div className="audio-bar" style={{ animationDelay: '0s' }} />
                    <div className="audio-bar" style={{ animationDelay: '0.1s' }} />
                    <div className="audio-bar" style={{ animationDelay: '0.2s' }} />
                    <div className="audio-bar" style={{ animationDelay: '0.15s' }} />
                </div>
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[--neo-primary] border-[2px] border-foreground flex items-center justify-center font-display text-xs">
                    {(user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                </div>
            </div>
        </header>
    )
}
