import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDocuments } from '@/hooks/useDocuments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Plus,
    FileText,
    BookOpen,
    Trash2,
    Clock,
} from 'lucide-react'

export default function Dashboard() {
    const { user } = useAuth()
    const { documents, loading, remove } = useDocuments()
    const firstName = user?.displayName?.split(' ')[0] || 'there'

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome back, {firstName}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Upload study material and start a practice interview
                </p>
            </div>

            {/* Quick action */}
            <Link to="/configure">
                <Card className="group cursor-pointer transition-colors hover:border-foreground/20">
                    <CardContent className="flex items-center gap-4 py-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-transform group-hover:scale-105">
                            <Plus className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">New Interview</p>
                            <p className="text-xs text-muted-foreground">
                                Upload a PDF and start practicing
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Documents */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Your Documents
                    </h2>
                    {documents.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                        </span>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="space-y-3">
                        {[1, 2].map((n) => (
                            <Card key={n}>
                                <CardContent className="py-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && documents.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                                <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium">No documents yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Upload your first PDF to get started
                            </p>
                            <Button asChild size="sm" className="mt-4">
                                <Link to="/configure">Upload PDF</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Document list */}
                {!loading && documents.length > 0 && (
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <Card key={doc.id} className="group">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            {doc.title}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (confirm('Delete this document?')) {
                                                    remove(doc.id)
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {doc.summary}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                                        <span>{doc.totalPages} pages</span>
                                        <span>·</span>
                                        <span>{doc.topics.length} topics</span>
                                        <span>·</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {doc.createdAt.toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
