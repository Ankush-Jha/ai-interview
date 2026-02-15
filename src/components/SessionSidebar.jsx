import { useMemo } from 'react'

const scoreColor = (score) => {
    if (score >= 7) return 'bg-emerald-500'
    if (score >= 4) return 'bg-amber-500'
    return 'bg-red-500'
}

const scoreTextColor = (score) => {
    if (score >= 7) return 'text-emerald-600'
    if (score >= 4) return 'text-amber-600'
    return 'text-red-500'
}

export default function SessionSidebar({ questions, currentIndex, evaluations, progress, elapsedTime, formatTime }) {
    const answeredCount = useMemo(
        () => Object.keys(evaluations || {}).length,
        [evaluations]
    )

    const avgScore = useMemo(() => {
        const evals = Object.values(evaluations || {}).filter(Boolean)
        if (evals.length === 0) return null
        return Math.round(evals.reduce((s, e) => s + (e?.score || 0), 0) / evals.length)
    }, [evaluations])

    return (
        <aside className="w-72 bg-white rounded-2xl border border-slate-200/80 p-5 h-fit sticky top-8 space-y-5">
            {/* Timer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-icons-round text-primary text-lg">timer</span>
                    <span className="text-sm font-medium text-slate-500">Time</span>
                </div>
                <span className="text-lg font-bold text-slate-900 font-mono">{formatTime(elapsedTime)}</span>
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Progress</span>
                    <span className="text-primary font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-slate-400">{answeredCount} of {questions.length} answered</p>
            </div>

            {/* Avg Score */}
            {avgScore !== null && (
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 font-medium mb-1">Average Score</p>
                    <p className={`text-2xl font-bold ${scoreTextColor(avgScore / 10 * 10)}`}>{avgScore}/10</p>
                </div>
            )}

            {/* Question Navigator */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Questions</p>
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {questions.map((q, i) => {
                        const isCurrent = i === currentIndex
                        const isAnswered = evaluations?.[i]
                        const score = isAnswered?.score

                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isCurrent
                                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                                    : isAnswered
                                        ? 'bg-slate-50 text-slate-600'
                                        : 'text-slate-400'
                                    }`}
                            >
                                {/* Number / Check */}
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrent ? 'bg-primary text-white' :
                                    isAnswered ? `${scoreColor(score)} text-white` :
                                        'bg-slate-100 text-slate-400'
                                    }`}>
                                    {isAnswered ? (
                                        <span className="material-icons-round text-xs">check</span>
                                    ) : (
                                        i + 1
                                    )}
                                </div>

                                {/* Label */}
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-xs">
                                        {q.topic || q.question?.slice(0, 30) + '...' || `Question ${i + 1}`}
                                    </p>
                                </div>

                                {/* Score */}
                                {isAnswered && score != null && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${score >= 7 ? 'bg-emerald-50 text-emerald-600' :
                                        score >= 4 ? 'bg-amber-50 text-amber-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                        {score}/10
                                    </span>
                                )}

                                {/* Mode pill */}
                                {q.mode && q.mode !== 'text' && (
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${q.mode === 'voice' ? 'bg-rose-50 text-rose-500' :
                                        q.mode === 'coding' ? 'bg-violet-50 text-violet-500' :
                                            'bg-blue-50 text-blue-500'
                                        }`}>
                                        {q.mode}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shortcuts</p>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between">
                        <span>Submit</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono">Ctrl+↵</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Skip</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono">Ctrl+S</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Pause</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono">Esc</kbd>
                    </div>
                </div>
            </div>
        </aside>
    )
}
