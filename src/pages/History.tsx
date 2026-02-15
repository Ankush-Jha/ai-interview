import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export default function History() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">History</h1>
                <p className="text-sm text-muted-foreground">
                    Your past interview sessions
                </p>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No interviews yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Start your first interview to see your history here
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
