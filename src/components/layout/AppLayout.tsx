import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export function AppLayout() {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:w-60 lg:flex-col flex-shrink-0">
                <Sidebar />
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-60 p-0">
                    <Sidebar onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Main */}
            <div className="flex flex-1 flex-col min-w-0">
                <Header onMenuClick={() => setMobileOpen(true)} />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
