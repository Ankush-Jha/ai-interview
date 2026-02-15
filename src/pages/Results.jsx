import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { generateReport } from '../lib/gemini'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ResultsSkeleton } from '../components/Skeleton'

export default function Results() {
    const { state, setReport } = useInterview()
    const { questions, answers, evaluations, settings, report } = state
    const [loading, setLocalLoading] = useState(!report)
    const [error, setError] = useState(null)
    const [showBreakdown, setShowBreakdown] = useState(false)
    const [showRubric, setShowRubric] = useState(false)
    const [copied, setCopied] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')
    useDocumentTitle('Interview Results', 'Review your AI interview performance analysis and personalized feedback.')

    useEffect(() => {
        if (report || questions.length === 0) { setLocalLoading(false); return }
        async function fetchReport() {
            try {
                const result = await generateReport({ questions, answers, evaluations, settings })
                setReport(result)
            } catch (err) {
                setError('Failed to generate report: ' + err.message)
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
            } finally { setLocalLoading(false) }
        }
        fetchReport()
    }, [])

    // Mode-specific stats
    const modeStats = useMemo(() => {
        const stats = { text: { count: 0, total: 0 }, voice: { count: 0, total: 0 }, coding: { count: 0, total: 0 } }
        questions.forEach((q, i) => {
            const mode = q.mode || 'text'
            if (stats[mode]) {
                stats[mode].count += 1
                stats[mode].total += (evaluations[i]?.score || 0) * 10
            }
        })
        return Object.entries(stats)
            .filter(([, d]) => d.count > 0)
            .map(([mode, d]) => ({
                mode,
                count: d.count,
                avg: Math.round(d.total / d.count),
                icon: mode === 'voice' ? 'mic' : mode === 'coding' ? 'code' : 'edit_note',
                label: mode.charAt(0).toUpperCase() + mode.slice(1),
                color: mode === 'voice' ? 'violet' : mode === 'coding' ? 'blue' : 'emerald',
            }))
    }, [questions, evaluations])

    // Type-based metrics
    const typeMetrics = useMemo(() => {
        const byType = {}
        questions.forEach((q, i) => {
            const type = q.type || 'general'
            if (!byType[type]) byType[type] = { total: 0, count: 0 }
            byType[type].total += (evaluations[i]?.score || 0) * 10
            byType[type].count += 1
        })
        return Object.entries(byType).map(([type, data]) => ({
            label: type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            score: Math.round(data.total / data.count),
            count: data.count,
            icon: type === 'mcq' ? 'list_alt' : type === 'scenario' ? 'extension' : type === 'coding' ? 'code' : 'psychology',
        }))
    }, [questions, evaluations])

    // Topic breakdown
    const topicData = useMemo(() => {
        const r = report || {}
        if (r.topicBreakdown?.length > 0) return r.topicBreakdown
        const byTopic = {}
        questions.forEach((q, i) => {
            const topic = q.topic || 'General'
            if (!byTopic[topic]) byTopic[topic] = { total: 0, count: 0 }
            byTopic[topic].total += (evaluations[i]?.score || 0) * 10
            byTopic[topic].count += 1
        })
        return Object.entries(byTopic).map(([topic, d]) => ({
            topic,
            score: Math.round(d.total / d.count),
            questionsCount: d.count,
        }))
    }, [questions, evaluations, report])

    if (loading) {
        return (
            <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-primary text-3xl animate-spin">psychology</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Generating Your Report</h2>
                    <p className="text-slate-400 text-sm">AI is analyzing your performance across all questions...</p>
                </div>
                <ResultsSkeleton />
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-4xl text-slate-300">quiz</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">No Results Yet</h2>
                    <p className="text-slate-500 mb-6">Complete an interview session to see your results.</p>
                    <Link to="/configure" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        <span className="material-icons-round text-lg">play_arrow</span>
                        Start Interview
                    </Link>
                </div>
            </div>
        )
    }

    const r = report || {}
    const overallScore = r.overallScore || 0
    const gradeColors = {
        'A+': 'emerald', 'A': 'emerald', 'B+': 'green', 'B': 'green',
        'C+': 'amber', 'C': 'amber', 'D': 'orange', 'F': 'red'
    }
    const gradeColor = gradeColors[r.grade] || 'slate'

    const handleCopy = () => {
        const text = [
            `Interview Report — Score: ${overallScore}/100 | Grade: ${r.grade}`,
            '', r.executiveSummary || '',
            '', '✅ Strengths:', ...(r.strengths || []).map(s => `  • ${s}`),
            '', '📈 Areas for Growth:', ...(r.weaknesses || []).map(w => `  • ${w}`),
            '', '💡 Tips:', ...(r.recommendations || []).map(t => `  • ${t}`),
        ].join('\n')
        navigator.clipboard.writeText(text)
            .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
            .catch(() => { })
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'questions', label: 'Questions', icon: 'quiz' },
        { id: 'insights', label: 'Insights', icon: 'insights' },
    ]

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
            {/* Header */}
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <span className="material-icons-round text-base">description</span>
                            <span>{state.document?.metadata?.fileName || 'Interview'}</span>
                            <span className="mx-1">•</span>
                            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Interview Results</h1>
                        <p className="text-slate-500 mt-1">
                            {settings?.difficulty} difficulty • {questions.length} questions
                            {modeStats.length > 1 && ` • ${modeStats.map(m => `${m.count} ${m.label}`).join(', ')}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 print:hidden">
                        <button onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm">
                            <span className="material-icons-round text-slate-400 text-base">{copied ? 'check' : 'content_copy'}</span>
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm">
                            <span className="material-icons-round text-slate-400 text-base">download</span>
                            PDF
                        </button>
                        <Link to="/"
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 text-sm">
                            <span className="material-icons-round text-base">home</span>
                            Home
                        </Link>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                    <span className="material-icons-round">warning</span>
                    {error}
                </div>
            )}

            {/* Score Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Overall Score Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="relative w-36 h-36 mb-4">
                            <svg className="circular-chart text-primary" viewBox="0 0 36 36">
                                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeDasharray={`${overallScore}, 100`} />
                                <text className="percentage" x="18" y="19.5" fill="#1E293B">{overallScore}</text>
                                <text className="percentage-label" x="18" y="24">SCORE</text>
                            </svg>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-${gradeColor}-100 text-${gradeColor}-700 border border-${gradeColor}-200`}>
                            Grade: {r.grade || '—'}
                        </span>
                        <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-${gradeColor}-50 text-${gradeColor}-600`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-${gradeColor}-500`}></span>
                            {r.matchLevel || 'Evaluated'}
                        </span>
                    </div>
                </div>

                {/* Right Column: summary + mode insights */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Executive Summary */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Coach Summary</h2>
                        <p className="text-slate-700 text-[15px] leading-relaxed">{r.executiveSummary || 'No summary available.'}</p>
                    </div>

                    {/* Mode Insights */}
                    {modeStats.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {modeStats.map((m) => (
                                <div key={m.mode} className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-9 h-9 rounded-xl bg-${m.color}-100 flex items-center justify-center`}>
                                            <span className={`material-icons-round text-${m.color}-600 text-lg`}>{m.icon}</span>
                                        </div>
                                        <span className="text-2xl font-bold text-slate-900">{m.avg}%</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">{m.label} Mode</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{m.count} question{m.count > 1 ? 's' : ''}</p>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <div className={`bg-${m.color}-500 h-1.5 rounded-full transition-all duration-700`} style={{ width: `${m.avg}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit print:hidden">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}>
                        <span className="material-icons-round text-base">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Type Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {typeMetrics.map((m, i) => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <span className="material-icons-round text-xl">{m.icon}</span>
                                    </div>
                                    <span className="text-2xl font-bold text-slate-900">{m.score}%</span>
                                </div>
                                <p className="text-sm font-medium text-slate-600">{m.label}</p>
                                <p className="text-xs text-slate-400">{m.count} question{m.count > 1 ? 's' : ''}</p>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-primary h-1.5 rounded-full transition-all duration-700" style={{ width: `${m.score}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                    <span className="material-icons-round text-sm">thumb_up</span>
                                </div>
                                <h3 className="font-semibold text-lg">Key Strengths</h3>
                            </div>
                            <ul className="space-y-3">
                                {(r.strengths || []).map((s, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-icons-round text-green-500 text-lg mt-0.5">check_circle</span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <span className="material-icons-round text-sm">trending_up</span>
                                </div>
                                <h3 className="font-semibold text-lg">Areas for Growth</h3>
                            </div>
                            <ul className="space-y-3">
                                {(r.weaknesses || []).map((w, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-icons-round text-orange-400 text-lg mt-0.5">info</span>
                                        <span>{w}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Recommendations */}
                    {r.recommendations?.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-primary">lightbulb</span>
                                AI Recommendations
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {r.recommendations.map((rec, i) => (
                                    <div key={i} className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 items-start">
                                        <span className="material-icons-round text-primary text-sm mt-0.5">arrow_forward</span>
                                        <p className="text-sm text-slate-700">{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Questions */}
            {activeTab === 'questions' && (
                <div className="space-y-4 animate-fade-in">
                    {questions.map((q, i) => {
                        const ev = evaluations[i]
                        const score = ev?.score ?? 0
                        const badgeColor = score >= 8 ? 'emerald' : score >= 6 ? 'amber' : score >= 4 ? 'orange' : 'red'
                        const mode = q.mode || 'text'
                        const modeIcon = mode === 'voice' ? 'mic' : mode === 'coding' ? 'code' : 'edit_note'
                        return (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${mode === 'voice' ? 'bg-violet-100 text-violet-700' : mode === 'coding' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                <span className="material-icons-round text-[10px]">{modeIcon}</span>
                                                {mode}
                                            </span>
                                            {q.difficulty && (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${q.difficulty === 'hard' ? 'bg-red-50 text-red-600' :
                                                        q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                                    }`}>{q.difficulty}</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                                        {q.why_asked && (
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <span className="material-icons-round text-xs">target</span>
                                                {q.why_asked}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl bg-${badgeColor}-50 border border-${badgeColor}-200`}>
                                        <span className={`text-lg font-bold text-${badgeColor}-700`}>{score}</span>
                                        <span className={`text-xs text-${badgeColor}-500`}>/10</span>
                                    </div>
                                </div>

                                {answers[i] && (
                                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs font-medium text-slate-500 mb-1">Your answer:</p>
                                        <p className="text-sm text-slate-600 line-clamp-3">{answers[i]}</p>
                                    </div>
                                )}

                                {ev?.feedback && (
                                    <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                        <p className="text-xs font-medium text-primary mb-1">AI Feedback:</p>
                                        <p className="text-sm text-slate-700">{ev.feedback}</p>
                                    </div>
                                )}

                                {ev?.reasoning && (
                                    <p className="text-xs text-slate-400 mt-2 italic">
                                        <span className="font-medium">Scoring reason:</span> {ev.reasoning}
                                    </p>
                                )}

                                {/* Strengths & Improvements for this question */}
                                {(ev?.strengths?.length > 0 || ev?.improvements?.length > 0) && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {(ev.strengths || []).map((s, j) => (
                                            <span key={`s-${j}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs">
                                                <span className="material-icons-round text-[10px]">add</span>{s}
                                            </span>
                                        ))}
                                        {(ev.improvements || []).map((im, j) => (
                                            <span key={`i-${j}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs">
                                                <span className="material-icons-round text-[10px]">arrow_upward</span>{im}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Tab: Insights */}
            {activeTab === 'insights' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Topic Breakdown */}
                    {topicData.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-primary">category</span>
                                Topic Breakdown
                            </h3>
                            <div className="space-y-4">
                                {topicData.map((t, i) => (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-700">{t.topic}</span>
                                                <span className="text-xs text-slate-400">{t.questionsCount}q</span>
                                            </div>
                                            <span className={`text-sm font-bold ${t.score >= 70 ? 'text-emerald-600' : t.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{t.score}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className={`h-2 rounded-full transition-all duration-700 ${t.score >= 70 ? 'bg-emerald-500' : t.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                }`} style={{ width: `${t.score}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Scoring Rubric */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                        <button onClick={() => setShowRubric(!showRubric)}
                            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-round text-primary">grading</span>
                                <h3 className="font-semibold text-lg">How Scoring Works</h3>
                            </div>
                            <span className={`material-icons-round text-slate-400 transition-transform ${showRubric ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {showRubric && (
                            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                {[
                                    { range: '1-3', label: 'Needs Work', color: 'red', desc: 'Off-topic or factually wrong' },
                                    { range: '4-5', label: 'Partial', color: 'orange', desc: 'General area but missing details' },
                                    { range: '6-7', label: 'Solid', color: 'amber', desc: 'Correct with minor gaps' },
                                    { range: '8-9', label: 'Strong', color: 'emerald', desc: 'Thorough with good examples' },
                                    { range: '10', label: 'Expert', color: 'green', desc: 'Would impress in a real interview' },
                                ].map((band) => (
                                    <div key={band.range} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold bg-${band.color}-100 text-${band.color}-700`}>{band.range}</span>
                                            <span className="text-sm font-semibold text-slate-700">{band.label}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{band.desc}</p>
                                    </div>
                                ))}
                                <div className="sm:col-span-2 lg:col-span-5 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <p className="text-xs text-blue-600 flex items-start gap-2">
                                        <span className="material-icons-round text-sm mt-0.5">info</span>
                                        Scoring evaluates depth of understanding, not keyword count. Creative answers that show real comprehension are rewarded.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Keyword Analysis */}
                    {evaluations.some(e => e?.keywordsFound?.length > 0 || e?.keywordsMissed?.length > 0) && (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-primary">label</span>
                                Keyword Coverage
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-green-600 mb-2">✓ Keywords Used</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[...new Set(evaluations.flatMap(e => e?.keywordsFound || []))].map((kw, i) => (
                                            <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-600 mb-2">✗ Keywords Missed</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[...new Set(evaluations.flatMap(e => e?.keywordsMissed || []))].map((kw, i) => (
                                            <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CTA Footer */}
            <div className="mt-8 bg-gradient-to-r from-primary/5 to-teal-500/5 rounded-2xl p-6 sm:p-10 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle, #13ecc8 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}></div>
                <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ready for the next round?</h3>
                    <p className="text-slate-500 max-w-xl">Upload a new document or adjust your settings to begin another AI-powered interview session.</p>
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Link to="/configure" className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto flex items-center justify-center gap-2 text-sm">
                        <span className="material-icons-round text-base">add_circle</span>
                        Start New Interview
                    </Link>
                </div>
            </div>
        </div>
    )
}
