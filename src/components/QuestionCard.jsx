const MODE_ICONS = {
    text: { icon: 'edit_note', color: 'blue' },
    voice: { icon: 'mic', color: 'rose' },
    coding: { icon: 'code', color: 'violet' },
}

export default function QuestionCard({ currentIndex, totalQuestions, question, phase, typedText, aiText }) {
    const mode = question?.mode || 'text'
    const modeInfo = MODE_ICONS[mode] || MODE_ICONS.text

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{currentIndex + 1}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                        Question {currentIndex + 1} of {totalQuestions}
                    </span>
                </div>

                {/* Mode pill + topic */}
                <div className="flex items-center gap-2">
                    {question?.topic && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                            {question.topic}
                        </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                        ${modeInfo.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                            modeInfo.color === 'rose' ? 'bg-rose-50 text-rose-500' :
                                'bg-violet-50 text-violet-500'
                        }`}>
                        <span className="material-icons-round text-xs">{modeInfo.icon}</span>
                        {mode}
                    </span>
                </div>
            </div>

            {/* Question Text */}
            <div className="min-h-[60px]">
                <p className="text-base text-slate-800 leading-relaxed font-medium">
                    {typedText || question?.question || 'Loading question...'}
                </p>
            </div>

            {/* AI response feedback preview */}
            {aiText && phase === 'feedback' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 leading-relaxed italic">
                        {aiText.slice(0, 200)}{aiText.length > 200 ? '...' : ''}
                    </p>
                </div>
            )}

            {/* Difficulty indicator */}
            {question?.difficulty && (
                <div className="mt-3 flex items-center gap-2">
                    <div className="flex gap-0.5">
                        {[1, 2, 3].map(level => (
                            <div
                                key={level}
                                className={`w-2 h-2 rounded-full ${level <= (question.difficulty === 'hard' ? 3 : question.difficulty === 'medium' ? 2 : 1)
                                    ? 'bg-primary'
                                    : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">{question.difficulty}</span>
                </div>
            )}
        </div>
    )
}
