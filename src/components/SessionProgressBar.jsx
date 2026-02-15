export default function SessionProgressBar({ questions, currentIndex, phase }) {
    const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                    Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            {/* Step dots */}
            <div className="flex items-center gap-1">
                {questions.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < currentIndex
                            ? 'bg-primary'
                            : i === currentIndex
                                ? 'bg-primary/40'
                                : 'bg-slate-100'
                            }`}
                    />
                ))}
            </div>
        </div>
    )
}
