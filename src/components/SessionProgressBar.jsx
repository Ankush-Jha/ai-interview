/**
 * SessionProgressBar — Segmented progress bar showing completed/current/remaining questions.
 */
export default function SessionProgressBar({ questions, currentIndex, phase }) {
    const progress = Math.round(
        ((currentIndex + (phase === 'done' ? 1 : 0)) / questions.length) * 100
    )

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Progress</span>
                <span className="text-xs font-bold text-primary">{progress}%</span>
            </div>
            <div className="flex gap-1">
                {questions.map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${i < currentIndex
                                ? 'bg-emerald-400'
                                : i === currentIndex
                                    ? 'bg-primary animate-pulse'
                                    : 'bg-slate-100'
                            }`}
                    />
                ))}
            </div>
        </div>
    )
}
