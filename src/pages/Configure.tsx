import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileDropzone } from '@/components/FileDropzone'
import { parsePDF } from '@/lib/pdf'
import { analyzeContent } from '@/lib/groq'
import { saveDocument } from '@/lib/documents'
import { useAuth } from '@/hooks/useAuth'
import type { ParsedDocument, DocumentAnalysis, BloomLevel } from '@/types/document'
import { toast } from 'sonner'

const bloomColors: Record<BloomLevel, string> = {
    remember: 'bg-background',
    understand: 'bg-blue-50 dark:bg-blue-950',
    apply: 'bg-green-50 dark:bg-green-950',
    analyze: 'bg-amber-50 dark:bg-amber-950',
    evaluate: 'bg-orange-50 dark:bg-orange-950',
    create: 'bg-violet-50 dark:bg-violet-950',
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
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl">NEW_INTERVIEW</h1>
                <p className="font-mono text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    Upload your study material to get started
                </p>
            </div>

            {/* Step 1: Upload */}
            {!analysis && (
                <FileDropzone onFileSelect={handleFileSelect} disabled={parsing || analyzing} />
            )}

            {/* Parsing state */}
            {parsing && (
                <div className="neo-card p-8 flex items-center justify-center gap-3">
                    <div className="flex gap-1 h-4 items-end">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="audio-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground uppercase">Extracting text from PDF…</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="neo-card p-4 border-[--neo-error]!" style={{ borderColor: 'var(--neo-error)', boxShadow: '6px 6px 0px 0px var(--neo-error)' }}>
                    <div className="flex items-start gap-3">
                        <span className="font-display text-xl text-[--neo-error]">✗</span>
                        <div>
                            <p className="font-bold text-sm text-[--neo-error]">ERROR</p>
                            <p className="font-mono text-xs text-muted-foreground mt-1">{error}</p>
                            <button onClick={handleReset} className="btn-neo bg-background px-4 py-1.5 font-mono text-[10px] font-bold mt-3">
                                [TRY AGAIN]
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Parsed — ready to analyze */}
            {parsed && !analysis && !analyzing && !error && (
                <div className="space-y-4">
                    <div className="neo-card p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📄</span>
                            <h3 className="font-display text-lg">{parsed.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                            <span>{parsed.pageCount} {parsed.pageCount === 1 ? 'PAGE' : 'PAGES'}</span>
                            <span className="w-px h-3 bg-foreground" />
                            <span>{parsed.text.split(/\s+/).length.toLocaleString()} WORDS</span>
                        </div>
                        <div className="border-t-[2px] border-foreground pt-4">
                            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                                {parsed.text.slice(0, 300).trim()}
                                {parsed.text.length > 300 && '…'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleReset} className="btn-neo bg-background px-5 py-2.5 font-mono text-xs font-bold">
                            [DIFFERENT FILE]
                        </button>
                        <button onClick={handleAnalyze} className="btn-neo bg-[--neo-primary] px-5 py-2.5 font-mono text-xs font-bold">
                            [ANALYZE CONTENT] ⚡
                        </button>
                    </div>
                </div>
            )}

            {/* Analyzing state */}
            {analyzing && (
                <div className="neo-card p-8 text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex gap-1 h-6 items-end">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="audio-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                            ))}
                        </div>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground uppercase">Analyzing your material…</p>
                    <div className="space-y-2 max-w-md mx-auto">
                        <div className="h-4 w-full bg-muted border-[2px] border-foreground/20 animate-pulse" />
                        <div className="h-4 w-3/4 bg-muted border-[2px] border-foreground/20 animate-pulse" />
                        <div className="h-4 w-1/2 bg-muted border-[2px] border-foreground/20 animate-pulse" />
                    </div>
                </div>
            )}

            {/* Analysis results */}
            {analysis && (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="neo-card p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📚</span>
                            <h3 className="font-display text-lg">{analysis.title}</h3>
                        </div>
                        <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                            {analysis.summary}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="neo-badge bg-[--neo-primary]">
                                {analysis.estimatedDifficulty}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                                {analysis.totalPages} PAGES • {analysis.topics.length} TOPICS
                            </span>
                        </div>
                    </div>

                    {/* Topics */}
                    <div className="neo-card p-6">
                        <h3 className="font-display text-sm mb-4">TOPICS & BLOOM'S LEVEL</h3>
                        <div className="space-y-3">
                            {analysis.topics.map((topic, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className={`neo-badge ${bloomColors[topic.bloomLevel]} flex-shrink-0`}>
                                        {topic.bloomLevel}
                                    </span>
                                    <div>
                                        <p className="font-bold text-sm">{topic.name}</p>
                                        <p className="font-mono text-xs text-muted-foreground">{topic.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Key terms */}
                    {analysis.keyTerms.length > 0 && (
                        <div className="neo-card p-6">
                            <h3 className="font-display text-sm mb-4">KEY_TERMS</h3>
                            <div className="flex flex-wrap gap-2">
                                {analysis.keyTerms.map((term, i) => (
                                    <span key={i} className="neo-badge bg-muted">
                                        {term}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button onClick={handleReset} className="btn-neo bg-background px-5 py-2.5 font-mono text-xs font-bold">
                            [START OVER]
                        </button>
                        <button
                            disabled={saving}
                            onClick={async () => {
                                if (!user || !analysis || !parsed) return
                                setSaving(true)
                                try {
                                    const docId = await saveDocument(user.uid, analysis, parsed.file)
                                    toast.success('Document saved — starting interview!')
                                    navigate(`/session/${docId}`, {
                                        state: {
                                            config: {
                                                persona: 'socratic',
                                                difficulty: analysis.estimatedDifficulty,
                                                questionCount: 5,
                                                questionTypes: ['conceptual', 'applied'],
                                            },
                                        },
                                    })
                                } catch (err) {
                                    toast.error(err instanceof Error ? err.message : 'Failed to save')
                                } finally {
                                    setSaving(false)
                                }
                            }}
                            className="btn-neo bg-[--neo-primary] px-5 py-2.5 font-mono text-xs font-bold"
                        >
                            {saving ? '[STARTING…]' : '[START INTERVIEW] →'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
