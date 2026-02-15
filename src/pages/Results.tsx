import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function Results() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Session Results</h1>
                <p className="text-sm text-muted-foreground">
                    Your interview performance breakdown
                </p>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                        <BarChart3 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No results to display</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Complete an interview to see your results
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
