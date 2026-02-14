/**
 * SessionSidebar — Right column: progress steps, live feedback, and timer.
 */
export default function SessionSidebar({ questions, currentIndex, evaluations, progress, feedback, elapsedTime, formatTime }) {
    return (
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-5">

            {/* Progress Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm">Session Progress</h3>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mb-5 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-icons-round text-primary text-xs">check</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Introduction</p>
                            <p className="text-xs text-slate-400">Completed</p>
                        </div>
                    </div>
                    {questions.map((q, i) => {
                        const isDone = evaluations[i] !== null
                        const isCurrent = i === currentIndex
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isDone
                                        ? 'bg-primary/20 text-primary'
                                        : isCurrent
                                            ? 'border-2 border-primary text-primary'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {isDone ? <span className="material-icons-round text-xs">check</span> : i + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm truncate ${isCurrent ? 'font-semibold text-slate-900' : isDone ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {q.topic || `Question ${i + 1}`}
                                    </p>
                                    {isCurrent && <p className="text-xs text-primary font-medium">In progress...</p>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Live Feedback Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1">
                <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <span className="material-icons-round text-primary text-base">lightbulb</span>
                    Live Feedback
                </h3>
                {feedback ? (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                        <p className="text-sm text-slate-600 leading-relaxed">{feedback}</p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">Feedback will appear after you answer a question.</p>
                )}
            </div>

            {/* Timer Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Elapsed Time</span>
                    <span className="text-lg font-mono font-bold text-slate-900">{formatTime(elapsedTime)}</span>
                </div>
            </div>
        </div>
    )
}
