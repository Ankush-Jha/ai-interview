/**
 * QuestionCard — Displays the current question with topic badge and difficulty indicator.
 */
export default function QuestionCard({ currentIndex, totalQuestions, question, phase, typedText, aiText }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl"></div>
            <div className="flex gap-4 items-start pl-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                    <span className="material-icons-round">smart_toy</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            Question {currentIndex + 1} of {totalQuestions}
                        </span>
                        {question.topic && (
                            <>
                                <span className="text-xs text-slate-300">•</span>
                                <span className="text-xs text-slate-400">{question.topic}</span>
                            </>
                        )}
                        {question.difficulty && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">
                                {question.difficulty}
                            </span>
                        )}
                    </div>
                    <p className="text-lg font-medium text-slate-800 leading-relaxed">
                        {phase === 'intro' ? typedText : (aiText || question.question)}
                    </p>
                </div>
            </div>
        </div>
    )
}
