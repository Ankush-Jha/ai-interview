import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileDropzone } from '@/components/FileDropzone'
import { parsePDF } from '@/lib/pdf'
import { analyzeContent } from '@/lib/groq'
import { saveDocument } from '@/lib/documents'
import { useAuth } from '@/hooks/useAuth'
import type { ParsedDocument, DocumentAnalysis, BloomLevel } from '@/types/document'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    FileText,
    Loader2,
    AlertCircle,
    Sparkles,
    BookOpen,
    ArrowRight,
} from 'lucide-react'

const bloomColors: Record<BloomLevel, string> = {
    remember: 'bg-slate-100 text-slate-700 border-slate-200',
    understand: 'bg-blue-50 text-blue-700 border-blue-200',
    apply: 'bg-green-50 text-green-700 border-green-200',
    analyze: 'bg-amber-50 text-amber-700 border-amber-200',
    evaluate: 'bg-orange-50 text-orange-700 border-orange-200',
    create: 'bg-violet-50 text-violet-700 border-violet-200',
}

const difficultyColors: Record<string, string> = {
    introductory: 'bg-green-50 text-green-700 border-green-200',
    intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
    advanced: 'bg-red-50 text-red-700 border-red-200',
}

export default function Configure() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [parsed, setParsed] = useState<ParsedDocument | null>(null)
    const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
    const [parsing, setParsing] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleFileSelect(file: File) {
        setParsing(true)
        setError(null)
        setParsed(null)
        setAnalysis(null)

        try {
            const result = await parsePDF(file)
            setParsed({ file, ...result })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse PDF')
        } finally {
            setParsing(false)
        }
    }

    async function handleAnalyze() {
        if (!parsed) return
        setAnalyzing(true)
        setError(null)

        try {
            const result = await analyzeContent(parsed.text, parsed.title, parsed.pageCount)
            setAnalysis(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed')
        } finally {
            setAnalyzing(false)
        }
    }

    function handleReset() {
        setParsed(null)
        setAnalysis(null)
        setError(null)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">New Interview</h1>
                <p className="text-sm text-muted-foreground">
                    Upload your study material to get started
                </p>
            </div>

            {/* Step 1: Upload */}
            {!analysis && (
                <FileDropzone
                    onFileSelect={handleFileSelect}
                    disabled={parsing || analyzing}
                />
            )}

            {/* Parsing state */}
            {parsing && (
                <Card>
                    <CardContent className="flex items-center justify-center gap-3 py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Extracting text from PDF…</p>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {error && (
                <Card className="border-destructive/50">
                    <CardContent className="flex items-start gap-3 py-4">
                        <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-destructive">Something went wrong</p>
                            <p className="text-xs text-muted-foreground mt-1">{error}</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={handleReset}>
                                Try again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Parsed — ready to analyze */}
            {parsed && !analysis && !analyzing && !error && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {parsed.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{parsed.pageCount} {parsed.pageCount === 1 ? 'page' : 'pages'}</span>
                                <Separator orientation="vertical" className="h-3" />
                                <span>{parsed.text.split(/\s+/).length.toLocaleString()} words</span>
                            </div>
                            <Separator />
                            <p className="text-sm leading-relaxed text-foreground/80">
                                {parsed.text.slice(0, 300).trim()}
                                {parsed.text.length > 300 && '…'}
                            </p>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleReset}>
                            Upload different file
                        </Button>
                        <Button onClick={handleAnalyze}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analyze Content
                        </Button>
                    </div>
                </div>
            )}

            {/* Analyzing state */}
            {analyzing && (
                <Card>
                    <CardContent className="py-8 space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Analyzing your material…</p>
                        </div>
                        <div className="space-y-2 max-w-md mx-auto">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Analysis results */}
            {analysis && (
                <div className="space-y-4">
                    {/* Summary card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                {analysis.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm leading-relaxed text-foreground/80">
                                {analysis.summary}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={difficultyColors[analysis.estimatedDifficulty] || ''}
                                >
                                    {analysis.estimatedDifficulty}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {analysis.totalPages} pages · {analysis.topics.length} topics
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Topics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Topics & Bloom's Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analysis.topics.map((topic, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 text-[10px] ${bloomColors[topic.bloomLevel]}`}
                                        >
                                            {topic.bloomLevel}
                                        </Badge>
                                        <div>
                                            <p className="text-sm font-medium">{topic.name}</p>
                                            <p className="text-xs text-muted-foreground">{topic.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Key terms */}
                    {analysis.keyTerms.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Key Terms</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keyTerms.map((term, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            {term}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleReset}>
                            Start over
                        </Button>
                        <Button
                            disabled={saving}
                            onClick={async () => {
                                if (!user || !analysis || !parsed) return
                                setSaving(true)
                                try {
                                    const docId = await saveDocument(user.uid, analysis, parsed.file)
                                    toast.success('Document saved!')
                                    navigate(`/`)
                                    void docId
                                } catch (err) {
                                    toast.error(err instanceof Error ? err.message : 'Failed to save')
                                } finally {
                                    setSaving(false)
                                }
                            }}
                        >
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowRight className="mr-2 h-4 w-4" />
                            )}
                            {saving ? 'Saving…' : 'Save & Continue'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
