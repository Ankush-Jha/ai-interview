import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock, BarChart3 } from 'lucide-react'

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome back, {user?.displayName?.split(' ')[0] || 'there'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Ready to practice for your next exam?
                </p>
            </div>

            {/* Action cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Start new */}
                <Card className="group cursor-pointer transition-colors hover:border-foreground/20" onClick={() => navigate('/configure')}>
                    <CardContent className="pt-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground mb-4">
                            <Plus className="h-5 w-5 text-background" />
                        </div>
                        <p className="text-sm font-medium">New Interview</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Upload material and start practicing
                        </p>
                    </CardContent>
                </Card>

                {/* History */}
                <Card className="group cursor-pointer transition-colors hover:border-foreground/20" onClick={() => navigate('/history')}>
                    <CardContent className="pt-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-4">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Recent Sessions</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            No sessions yet — start your first one
                        </p>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-4">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">Your Stats</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Complete an interview to see your progress
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick start CTA */}
            <div className="rounded-lg border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                    Upload your lecture notes or PDF to start an AI-powered practice interview
                </p>
                <Button onClick={() => navigate('/configure')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Interview
                </Button>
            </div>
        </div>
    )
}
