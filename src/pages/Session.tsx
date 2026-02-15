import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function Session() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Interview Session</h1>
                <p className="text-sm text-muted-foreground">
                    Your active interview session
                </p>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                        <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No active session</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Configure and start an interview to begin
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
