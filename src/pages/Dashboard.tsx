import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
    const { user } = useAuth()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Welcome back, {user?.displayName || user?.email}
                </p>
            </div>

            <div className="rounded-lg border p-6 text-center text-muted-foreground">
                <p className="text-sm">Your dashboard content will appear here.</p>
            </div>

            <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
            </Button>
        </div>
    )
}
