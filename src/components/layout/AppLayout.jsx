import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 font-display">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
