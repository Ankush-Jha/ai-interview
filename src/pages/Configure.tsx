import { Card, CardContent } from '@/components/ui/card'
import { Upload } from 'lucide-react'

export default function Configure() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">New Interview</h1>
                <p className="text-sm text-muted-foreground">
                    Upload your study material and configure your interview
                </p>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Upload a document to get started</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        PDF, images, or text files — we'll extract the content for your interview
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
