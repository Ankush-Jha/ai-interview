import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { generateReport } from '../lib/gemini'
import { generatePDFReport } from '../utils/pdfGenerator'
import TranscriptModal from '../components/TranscriptModal'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ResultsSkeleton } from '../components/Skeleton'

export default function Results() {
    const { state, setReport, setLoading } = useInterview()
    const { questions, answers, evaluations, settings, report } = state
    const [loading, setLocalLoading] = useState(!report)
    const [error, setError] = useState(null)
    const [showRubric, setShowRubric] = useState(false)
    const [showBreakdown, setShowBreakdown] = useState(false)
    const [showTranscript, setShowTranscript] = useState(false) // New
    const [copied, setCopied] = useState(false)
    useDocumentTitle('Interview Results', 'Review your AI interview performance analysis and personalized feedback.')

    // Generate report on mount if not already done
    useEffect(() => {
        if (report || questions.length === 0) {
            setLocalLoading(false)
            return
        }

        async function fetchReport() {
            try {
                const result = await generateReport({
                    questions,
                    answers,
                    evaluations,
                    settings,
                })
                setReport(result)
            } catch (err) {
                setError('Failed to generate report: ' + err.message)
                // Fallback report from evaluation scores
                const avgScore = evaluations.filter(Boolean).length > 0
                    ? Math.round(evaluations.filter(Boolean).reduce((sum, e) => sum + (e?.score || 0), 0) / evaluations.filter(Boolean).length * 10)
                    : 0
                setReport({
                    overallScore: avgScore,
                    grade: avgScore >= 90 ? 'A+' : avgScore >= 80 ? 'A' : avgScore >= 70 ? 'B+' : avgScore >= 60 ? 'B' : avgScore >= 50 ? 'C' : 'D',
                    executiveSummary: 'Report generation failed. Scores are based on individual question evaluations.',
                    strengths: ['Completed the interview session'],
                    weaknesses: ['Report unavailable due to error'],
                    recommendations: ['Try again with a fresh session'],
                    topicBreakdown: [],
                    matchLevel: avgScore >= 70 ? 'Good Match' : 'Needs Improvement',
                })
            } finally {
                setLocalLoading(false)
            }
        }
        fetchReport()
    }, [])

    // Loading state
    if (loading) {
        return (
            <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-primary text-3xl animate-spin">psychology</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Generating Your Report</h2>
                    <p className="text-slate-400 text-sm">AI is analyzing your performance across all questions...</p>
                </div>
                <ResultsSkeleton />
            </div>
        )
    }

    // No data state
    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <span className="material-icons-round text-5xl text-slate-300 mb-4">quiz</span>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">No Results Yet</h2>
                    <p className="text-slate-500 mb-6">Complete an interview session to see your results.</p>
                    <Link to="/configure" className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        Start Interview
                    </Link>
                </div>
            </div>
        )
    }

    const r = report || {}
    const overallScore = r.overallScore || 0
    const scoreColor = overallScore >= 80 ? 'green' : overallScore >= 60 ? 'amber' : 'red'

    // Per-question metrics
    const avgByType = {}
    questions.forEach((q, i) => {
        const type = q.type || 'general'
        if (!avgByType[type]) avgByType[type] = { total: 0, count: 0 }
        avgByType[type].total += (evaluations[i]?.score || 0) * 10
        avgByType[type].count += 1
    })

    const metrics = Object.entries(avgByType).map(([type, data]) => ({
        label: type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        score: Math.round(data.total / data.count),
        icon: type === 'mcq' ? 'list_alt' : type === 'scenario' ? 'extension' : 'psychology',
    }))

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <span className="material-icons-round text-base">description</span>
                        <span>{state.document?.metadata?.fileName || 'Interview'}</span>
                        <span className="mx-1">•</span>
                        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Interview Results Analysis</h1>
                    <p className="text-slate-500 mt-1">
                        {r.grade && <span className="font-semibold text-slate-700">Grade: {r.grade}</span>}
                        {' — '}
                        {settings?.difficulty} difficulty • {questions.length} questions
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
                    <button
                        onClick={() => setShowTranscript(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <span className="material-icons-round text-lg">chat</span>
                        <span className="hidden sm:inline">View Transcript</span>
                    </button>
                    <button
                        onClick={() => generatePDFReport({ questions, answers: state.answers, evaluations, report, settings })}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                    >
                        <span className="material-icons-round text-lg">download</span>
                        <span className="hidden sm:inline">Download Report</span>
                    </button>
                    <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                        <span className="material-icons-round text-lg">dashboard</span>
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <span className="material-icons-round">warning</span>
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Overall Score */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-6 h-full border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="material-icons-round text-primary">analytics</span>
                            Overall Performance
                        </h2>
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="relative w-56 h-56">
                                <svg className="circular-chart text-primary" viewBox="0 0 36 36">
                                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeDasharray={`${overallScore}, 100`} />
                                    <text className="percentage" x="18" y="19" fill="#1E293B">{overallScore}</text>
                                    <text className="percentage-label" x="18" y="23.5">TOTAL SCORE</text>
                                </svg>
                            </div>
                            <div className="mt-6 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-${scoreColor}-500/10 text-${scoreColor}-600 border border-${scoreColor}-500/20`}>
                                    <span className={`w-1.5 h-1.5 rounded-full bg-${scoreColor}-500 mr-2`}></span>
                                    {r.matchLevel || 'Evaluated'}
                                </span>
                                <p className="text-sm text-slate-500 mt-3 px-4">{r.executiveSummary || ''}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Sub-metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {metrics.map((m, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <span className="material-icons-round text-xl">{m.icon}</span>
                                    </div>
                                    <span className="text-xl font-bold text-slate-900">{m.score}%</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600">{m.label}</p>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${m.score}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                    <span className="material-icons-round text-sm">thumb_up</span>
                                </div>
                                <h3 className="font-semibold text-lg">Key Strengths</h3>
                            </div>
                            <ul className="space-y-4 flex-grow">
                                {(r.strengths || []).map((s, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-icons-round text-green-500 text-lg mt-0.5">check_circle</span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <span className="material-icons-round text-sm">trending_up</span>
                                </div>
                                <h3 className="font-semibold text-lg">Areas for Growth</h3>
                            </div>
                            <ul className="space-y-4 flex-grow">
                                {(r.weaknesses || []).map((w, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-icons-round text-orange-400 text-lg mt-0.5">info</span>
                                        <span>{w}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            {r.recommendations?.length > 0 && (
                <section className="mb-8 bg-white rounded-xl p-6 border border-slate-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <span className="material-icons-round text-primary">lightbulb</span>
                        AI Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {r.recommendations.map((rec, i) => (
                            <div key={i} className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex gap-3 items-start">
                                <span className="material-icons-round text-primary text-sm mt-0.5">arrow_forward</span>
                                <p className="text-sm text-slate-700">{rec}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Per-Question Breakdown — Transparency */}
            {questions.length > 0 && (
                <section className="mb-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary">quiz</span>
                            <h3 className="font-bold text-lg">Question-by-Question Breakdown</h3>
                        </div>
                        <span className={`material-icons-round text-slate-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>
                    {showBreakdown && (
                        <div className="px-6 pb-6 space-y-4">
                            {questions.map((q, i) => {
                                const ev = evaluations[i]
                                const score = ev?.score ?? 0
                                const badgeColor = score >= 8 ? 'emerald' : score >= 6 ? 'amber' : score >= 4 ? 'orange' : 'red'
                                return (
                                    <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Q{i + 1}: {q.question}
                                                </p>
                                                {q.why_asked && (
                                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <span className="material-icons-round text-xs">target</span>
                                                        {q.why_asked}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-${badgeColor}-100 text-${badgeColor}-700 whitespace-nowrap`}>
                                                {score}/10
                                            </span>
                                        </div>
                                        {ev?.reasoning && (
                                            <p className="text-xs text-slate-600 bg-white rounded px-3 py-2 border border-slate-100 mt-2">
                                                <span className="font-medium text-slate-700">Why this score: </span>
                                                {ev.reasoning}
                                            </p>
                                        )}
                                        {answers[i] && (
                                            <p className="text-xs text-slate-400 mt-2 truncate">
                                                <span className="font-medium">Your answer:</span> {answers[i]}
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
            )}
            {/* How Scoring Works — Transparency */}
            <section className="mb-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                    onClick={() => setShowRubric(!showRubric)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="material-icons-round text-primary">grading</span>
                        <h3 className="font-bold text-lg">How Scoring Works</h3>
                    </div>
                    <span className={`material-icons-round text-slate-400 transition-transform ${showRubric ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </button>
                {showRubric && (
                    <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {[
                            { range: '1-3', label: 'Needs Work', color: 'red', desc: 'Off-topic, factually wrong, or essentially empty' },
                            { range: '4-5', label: 'Partial', color: 'orange', desc: 'Gets the general area but misses key details' },
                            { range: '6-7', label: 'Solid', color: 'amber', desc: 'Correct and reasonable with minor gaps' },
                            { range: '8-9', label: 'Strong', color: 'emerald', desc: 'Thorough, well-structured with good examples' },
                            { range: '10', label: 'Expert', color: 'green', desc: 'Beyond expectations — would impress in a real interview' },
                        ].map((band) => (
                            <div key={band.range} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold bg-${band.color}-100 text-${band.color}-700`}>
                                        {band.range}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-700">{band.label}</span>
                                </div>
                                <p className="text-xs text-slate-500">{band.desc}</p>
                            </div>
                        ))}
                        <div className="sm:col-span-2 lg:col-span-5 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-xs text-blue-600 flex items-start gap-2">
                                <span className="material-icons-round text-sm mt-0.5">info</span>
                                Scoring evaluates depth of understanding, not keyword count. Creative answers that show real comprehension are rewarded over textbook phrasing.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            {/* CTA Footer */}
            <div className="bg-primary/5 rounded-2xl p-6 sm:p-10 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 pointer-events-none"></div>
                <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ready for the next round?</h3>
                    <p className="text-slate-500 max-w-xl">Upload a new document or adjust your settings to begin a new AI-powered interview session.</p>
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={() => {
                            const text = [
                                `Interview Report — Score: ${report?.overallScore ?? avgScore}/10`,
                                '',
                                '✅ Strengths:',
                                ...(report?.strengths || []).map(s => `  • ${s}`),
                                '',
                                '📈 Areas for Growth:',
                                ...(report?.weaknesses || []).map(w => `  • ${w}`),
                                '',
                                '💡 Tips:',
                                ...(report?.recommendations || report?.tips || []).map(t => `  • ${t}`),
                            ].join('\n')
                            navigator.clipboard.writeText(text)
                                .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
                                .catch(() => { })
                        }}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                        aria-label="Copy report to clipboard"
                    >
                        <span className="material-icons-round text-base">{copied ? 'check' : 'content_copy'}</span>
                        {copied ? 'Copied!' : 'Copy Report'}
                    </button>
                    <Link to="/" className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto flex items-center justify-center gap-2">
                        <span className="material-icons-round">add_circle</span>
                        Start New Interview
                    </Link>
                </div>
            </div>
            {/* Transcript Modal */}
            <TranscriptModal
                isOpen={showTranscript}
                onClose={() => setShowTranscript(false)}
                history={state.conversationHistory || []}
            />
        </div>
    )
}
