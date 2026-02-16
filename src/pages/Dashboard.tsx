import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDocuments } from '@/hooks/useDocuments'
import { useSessions } from '@/hooks/useSessions'

export default function Dashboard() {
    const { user } = useAuth()
    const { documents, loading: docsLoading, remove } = useDocuments()
    const { sessions, loading: sessionsLoading } = useSessions()
    const firstName = user?.displayName?.split(' ')[0] || 'there'

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="font-display text-3xl">
                    WELCOME, {firstName.toUpperCase()}
                </h1>
                <p className="font-mono text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    Upload study material and start a practice interview
                </p>
            </div>

            {/* Quick action */}
            <Link to="/configure" className="block group">
                <div className="neo-card p-5 flex items-center gap-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                    <div className="w-12 h-12 bg-[--neo-primary] border-[3px] border-foreground shadow-hard-xs flex items-center justify-center flex-shrink-0 group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">
                        <span className="font-display text-2xl">+</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm">NEW INTERVIEW</p>
                        <p className="font-mono text-xs text-muted-foreground">
                            Upload a PDF and start practicing
                        </p>
                    </div>
                    <span className="ml-auto font-display text-xl group-hover:translate-x-1 transition-transform">→</span>
                </div>
            </Link>

            {/* Recent Sessions */}
            <div className="space-y-4">
                <h2 className="font-display text-sm tracking-wider">RECENT_SESSIONS</h2>

                {sessionsLoading && (
                    <div className="space-y-3">
                        {[1, 2].map((n) => (
                            <div key={n} className="neo-card-sm p-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-48 bg-muted border-[2px] border-foreground/20 animate-pulse" />
                                    <div className="h-3 w-32 bg-muted border-[2px] border-foreground/20 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!sessionsLoading && sessions.length === 0 && (
                    <div className="neo-card p-8 text-center">
                        <div className="w-12 h-12 mx-auto bg-muted border-[3px] border-foreground shadow-hard-xs flex items-center justify-center mb-4">
                            <span className="font-display text-xl">💬</span>
                        </div>
                        <p className="font-bold text-sm">NO SESSIONS YET</p>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                            Complete an interview to see results here
                        </p>
                    </div>
                )}

                {!sessionsLoading && sessions.length > 0 && (
                    <div className="space-y-3">
                        {sessions.slice(0, 5).map((s) => (
                            <Link
                                key={s.firestoreId}
                                to={s.state === 'completed' ? `/results/${s.firestoreId}` : `/session/${s.documentId}`}
                            >
                                <div className="neo-card-sm p-4 flex items-center gap-4 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mb-3">
                                    <div className="w-9 h-9 bg-[--neo-primary] border-[2px] border-foreground flex-shrink-0 flex items-center justify-center font-display text-sm">
                                        {s.overallScore != null ? s.overallScore : '—'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">
                                            {s.documentTitle}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                                            <span>{s.questions.length} Q</span>
                                            <span>•</span>
                                            <span>{s.createdAt.toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="neo-badge bg-background">
                                        {s.state === 'completed' ? 'DONE' : 'ACTIVE'}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Documents */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-sm tracking-wider">YOUR_DOCUMENTS</h2>
                    {documents.length > 0 && (
                        <span className="neo-badge bg-background">
                            {documents.length} {documents.length === 1 ? 'DOC' : 'DOCS'}
                        </span>
                    )}
                </div>

                {docsLoading && (
                    <div className="space-y-3">
                        {[1, 2].map((n) => (
                            <div key={n} className="neo-card-sm p-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-48 bg-muted border-[2px] border-foreground/20 animate-pulse" />
                                    <div className="h-3 w-full bg-muted border-[2px] border-foreground/20 animate-pulse" />
                                    <div className="h-3 w-24 bg-muted border-[2px] border-foreground/20 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!docsLoading && documents.length === 0 && (
                    <div className="neo-card p-10 text-center">
                        <div className="w-14 h-14 mx-auto bg-muted border-[3px] border-foreground shadow-hard-sm flex items-center justify-center mb-4">
                            <span className="font-display text-2xl">📄</span>
                        </div>
                        <p className="font-bold text-sm">NO DOCUMENTS YET</p>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                            Upload your first PDF to get started
                        </p>
                        <Link to="/configure">
                            <button className="btn-neo bg-[--neo-primary] px-6 py-2 font-mono text-xs font-bold mt-4">
                                [UPLOAD PDF]
                            </button>
                        </Link>
                    </div>
                )}

                {!docsLoading && documents.length > 0 && (
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div key={doc.id} className="neo-card-sm p-4 group">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        <span className="text-muted-foreground">📄</span>
                                        {doc.title}
                                    </h3>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-xs text-[--neo-error] font-bold hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            if (confirm('Delete this document?')) {
                                                remove(doc.id)
                                            }
                                        }}
                                    >
                                        [DEL]
                                    </button>
                                </div>
                                <p className="font-mono text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {doc.summary}
                                </p>
                                <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                                    <span>{doc.totalPages} PAGES</span>
                                    <span>•</span>
                                    <span>{doc.topics.length} TOPICS</span>
                                    <span>•</span>
                                    <span>{doc.createdAt.toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
