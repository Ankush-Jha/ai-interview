import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { evaluateAnswer, evaluateCode } from '../lib/gemini'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import CodeEditor from '../components/CodeEditor'

/* ─── Starter Code Generator ─── */
function toSnakeCase(name) {
    return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
}

function getStarterCode(fnName, lang) {
    const snakeName = toSnakeCase(fnName)
    const l = (lang || 'python').toLowerCase()

    if (l === 'python' || l === 'py') {
        return `def ${snakeName}(data):\n    # Write your solution here\n    pass\n`
    }
    if (l === 'java') {
        return `public static Object ${fnName}(Object data) {\n    // Write your solution here\n    return null;\n}\n`
    }
    if (l === 'cpp' || l === 'c++') {
        return `auto ${fnName}(auto data) {\n    // Write your solution here\n}\n`
    }
    // JavaScript default
    return `function ${fnName}(data) {\n  // Write your solution here\n}\n`
}

/* ─── Voice Mode Sub-component ─── */
function VoiceMode({ transcript, interimTranscript, isListening, onStart, onStop }) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-8">
            <div className={`voice-visualizer mb-6 ${isListening ? 'active' : ''}`}>
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center relative">
                    <span className="material-icons-round text-4xl text-primary">mic</span>
                    {isListening && (
                        <>
                            <span className="mic-pulse" />
                            <span className="mic-pulse" style={{ animationDelay: '0.3s' }} />
                        </>
                    )}
                </div>
            </div>
            <button
                onClick={isListening ? onStop : onStart}
                className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-dark'
                    }`}
            >
                {isListening ? 'Stop Recording' : 'Start Speaking'}
            </button>
            {(transcript || interimTranscript) && (
                <div className="mt-6 w-full max-w-lg bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <p className="text-sm text-slate-800">{transcript}</p>
                    {interimTranscript && (
                        <p className="text-sm text-slate-400 italic">{interimTranscript}</p>
                    )}
                </div>
            )}
        </div>
    )
}

/* ─── Text Answer Mode Sub-component ─── */
function TextMode({ answer, setAnswer }) {
    return (
        <div className="flex-1 flex flex-col">
            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="flex-1 w-full p-6 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-slate-400"
                rows={8}
            />
            <p className="text-xs text-slate-400 mt-2 text-right px-2">
                {answer.length} characters
            </p>
        </div>
    )
}

/* ─── Feedback Panel ─── */
function FeedbackPanel({ evaluation, onNext, isCoding = false }) {
    if (!evaluation) return null

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-4 space-y-6 animate-fade-up">
            {/* Score Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black text-white ${evaluation.score >= 7 ? 'bg-emerald-500' : evaluation.score >= 4 ? 'bg-amber-500' : 'bg-red-500'}`}>
                    {evaluation.score}/10
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                        {evaluation.score >= 8 ? '🎉 Excellent!' :
                            evaluation.score >= 6 ? '👍 Good effort!' :
                                evaluation.score >= 4 ? '💡 Getting there' :
                                    '📚 Keep practicing'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">{evaluation.feedback}</p>
                </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluation.strengths?.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                        <h4 className="font-semibold text-emerald-700 text-sm mb-2 flex items-center gap-2">
                            <span className="material-icons-round text-sm">thumb_up</span> Strengths
                        </h4>
                        <ul className="text-sm text-emerald-800 space-y-1">
                            {evaluation.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                    </div>
                )}
                {evaluation.improvements?.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                        <h4 className="font-semibold text-amber-700 text-sm mb-2 flex items-center gap-2">
                            <span className="material-icons-round text-sm">trending_up</span> Improve
                        </h4>
                        <ul className="text-sm text-amber-800 space-y-1">
                            {evaluation.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            {/* Model Answer */}
            {evaluation.modelAnswer && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-700 text-sm mb-2 flex items-center gap-2">
                        <span className="material-icons-round text-sm">auto_awesome</span> Model Answer
                    </h4>
                    {isCoding ? (
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-900 text-slate-200 p-4 rounded-lg overflow-x-auto">
                            {evaluation.modelAnswer}
                        </pre>
                    ) : (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{evaluation.modelAnswer}</p>
                    )}
                </div>
            )}

            {/* Complexity (coding only) */}
            {isCoding && evaluation.complexity && (
                <div className="flex gap-4 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                        ⏱ Time: {evaluation.complexity.time}
                    </span>
                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                        💾 Space: {evaluation.complexity.space}
                    </span>
                </div>
            )}

            {/* Next Button */}
            <button
                onClick={onNext}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
                <span className="material-icons-round">arrow_forward</span>
                Next Question
            </button>
        </div>
    )
}

/* ─── Mode Icon ─── */
function ModeIcon({ mode }) {
    const config = {
        coding: { icon: 'code', color: 'text-blue-500', bg: 'bg-blue-50', label: 'Code' },
        voice: { icon: 'mic', color: 'text-purple-500', bg: 'bg-purple-50', label: 'Voice' },
        text: { icon: 'edit', color: 'text-slate-500', bg: 'bg-slate-50', label: 'Text' },
    }
    const c = config[mode] || config.text
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.bg} ${c.color}`}>
            <span className="material-icons-round text-xs">{c.icon}</span>
            {c.label}
        </span>
    )
}

/* ─── Main Interview Session ─── */
export default function InterviewSession() {
    const {
        state, submitAnswer, setEvaluation, nextQuestion, setReport,
        setCode, setTestResults
    } = useInterview()
    const navigate = useNavigate()
    const { questions, currentIndex, answers, evaluations, settings, codeSubmissions, testResults } = state

    const [inputMode, setInputMode] = useState('text') // manual override for non-coding
    const [textAnswer, setTextAnswer] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)

    const speech = useSpeechRecognition()
    const synth = useSpeechSynthesis()

    const currentQuestion = questions[currentIndex]
    const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0
    const isLastQuestion = currentIndex === questions.length - 1

    // Determine the effective mode for current question
    const effectiveMode = currentQuestion?.mode === 'coding' ? 'coding' : inputMode

    // Read question aloud when it changes (voice mode)
    useEffect(() => {
        if (inputMode === 'voice' && currentQuestion && effectiveMode !== 'coding') {
            synth.speak(currentQuestion.question)
        }
    }, [currentIndex, inputMode])

    // Redirect if no questions loaded
    useEffect(() => {
        if (questions.length === 0) {
            navigate('/configure')
        }
    }, [questions, navigate])

    // Handle text/voice submit
    const handleSubmitAnswer = useCallback(async () => {
        const answer = inputMode === 'voice' ? speech.transcript : textAnswer
        if (!answer || answer.trim().length === 0) return

        setSubmitting(true)
        submitAnswer(currentIndex, answer)

        try {
            const evaluation = await evaluateAnswer(
                currentQuestion.question,
                answer,
                state.document?.text?.slice(0, 3000) || ''
            )
            setEvaluation(currentIndex, evaluation)
            setShowFeedback(true)
        } catch (err) {
            setEvaluation(currentIndex, {
                score: 5,
                feedback: 'Evaluation unavailable — answer recorded.',
                modelAnswer: '',
                strengths: [],
                improvements: [],
            })
            setShowFeedback(true)
        }
        setSubmitting(false)
        if (inputMode === 'voice') speech.stop()
    }, [inputMode, speech.transcript, textAnswer, currentIndex, currentQuestion, state.document])

    // Handle coding submit
    const handleCodeSubmit = useCallback(async (code, results, language) => {
        setSubmitting(true)
        setCode(currentIndex, code)
        setTestResults(currentIndex, results)
        submitAnswer(currentIndex, `[CODE:${language}]\n${code}`)

        try {
            const evaluation = await evaluateCode(
                currentQuestion.question,
                code,
                results,
                language
            )
            setEvaluation(currentIndex, evaluation)
            setShowFeedback(true)
        } catch (err) {
            // Use test results for score if AI eval fails
            const score = results ? Math.round((results.passed / Math.max(results.total, 1)) * 10) : 5
            setEvaluation(currentIndex, {
                score,
                feedback: `Your code passed ${results?.passed || 0}/${results?.total || 0} test cases. AI feedback unavailable.`,
                modelAnswer: '',
                strengths: results?.passed > 0 ? ['Some tests passing'] : [],
                improvements: ['Review failing test cases'],
            })
            setShowFeedback(true)
        }
        setSubmitting(false)
    }, [currentIndex, currentQuestion])

    const handleNext = useCallback(() => {
        setShowFeedback(false)
        setTextAnswer('')
        speech.reset()

        if (isLastQuestion) {
            const historyEntry = {
                id: Date.now(),
                documentName: state.document?.metadata?.fileName || 'Interview',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                score: Math.round(
                    evaluations.filter(Boolean).reduce((sum, e) => sum + (e?.score || 0), 0) /
                    Math.max(evaluations.filter(Boolean).length, 1) * 10
                ),
                questionCount: questions.length,
                difficulty: settings?.difficulty || 'medium',
                persona: settings?.persona || 'academic',
                codingQuestions: questions.filter(q => q.mode === 'coding').length,
            }
            const history = JSON.parse(localStorage.getItem('interviewHistory') || '[]')
            history.unshift(historyEntry)
            localStorage.setItem('interviewHistory', JSON.stringify(history.slice(0, 50)))

            navigate('/results')
        } else {
            nextQuestion()
        }
    }, [isLastQuestion, evaluations, questions, settings, state.document, navigate, nextQuestion, speech])

    const handleSkip = useCallback(() => {
        submitAnswer(currentIndex, '(skipped)')
        setEvaluation(currentIndex, { score: 0, feedback: 'Question skipped.', modelAnswer: '', strengths: [], improvements: [] })
        handleNext()
    }, [currentIndex, handleNext])

    if (!currentQuestion) return null

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden relative">
            {/* ── CODING MODE: Full-screen editor layout ── */}
            {effectiveMode === 'coding' && !showFeedback && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Thin top bar */}
                    <div className="h-11 bg-[#181825] border-b border-slate-700/50 flex items-center px-4 gap-3 flex-shrink-0">
                        <Link to="/" className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 text-xs">
                            <span className="material-icons-round text-sm">arrow_back</span>
                            Back
                        </Link>
                        <div className="w-px h-5 bg-slate-700" />
                        <span className="text-sm font-bold text-slate-200 truncate">
                            {currentQuestion.topic || `Question ${currentIndex + 1}`}
                        </span>
                        <span className="text-[10px] text-slate-500">
                            {currentIndex + 1}/{questions.length}
                        </span>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">Progress</span>
                            <div className="w-24 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold">{progress}%</span>
                        </div>
                        <button
                            onClick={handleSkip}
                            className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
                        >
                            Skip →
                        </button>
                    </div>

                    {/* Full-screen code editor */}
                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            question={currentQuestion.question}
                            starterCode={currentQuestion.starterCode || getStarterCode(
                                currentQuestion.functionName || 'solution',
                                currentQuestion.language || 'python'
                            )}
                            language={currentQuestion.language || 'python'}
                            testCases={currentQuestion.testCases || []}
                            functionName={currentQuestion.functionName || 'solution'}
                            hints={currentQuestion.hints || []}
                            difficulty={currentQuestion.difficulty || 'medium'}
                            topic={currentQuestion.topic || ''}
                            points={10}
                            onSubmit={handleCodeSubmit}
                            disabled={submitting}
                        />
                    </div>
                </div>
            )}

            {/* ── CODING MODE: Feedback overlay ── */}
            {effectiveMode === 'coding' && showFeedback && (
                <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
                    <div className="max-w-2xl w-full">
                        <FeedbackPanel
                            evaluation={evaluations[currentIndex]}
                            onNext={handleNext}
                            isCoding={true}
                        />
                    </div>
                </div>
            )}

            {/* ── TEXT/VOICE MODE: Normal layout ── */}
            {effectiveMode !== 'coding' && (
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Left: Main Content */}
                    <div className="flex-1 flex flex-col h-full overflow-y-auto relative p-4 md:p-8 lg:pr-4">
                        {/* Title Bar */}
                        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Interview: {state.document?.metadata?.title || 'AI Session'}
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    {settings?.persona} • {settings?.difficulty} difficulty • {questions.length} questions
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                                    <button
                                        onClick={() => setInputMode('text')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'text' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <span className={`material-icons-round text-base ${inputMode === 'text' ? 'text-primary' : ''}`}>edit</span>
                                        Text
                                    </button>
                                    <button
                                        onClick={() => setInputMode('voice')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'voice' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <span className={`material-icons-round text-base ${inputMode === 'voice' ? 'text-primary' : ''}`}>mic</span>
                                        Voice
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 mb-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                            <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary mt-1">
                                    <span className="material-icons-round">smart_toy</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                            Question {currentIndex + 1} of {questions.length}
                                        </span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <ModeIcon mode={effectiveMode} />
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${currentQuestion.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                                            currentQuestion.difficulty === 'hard' ? 'bg-red-50 text-red-600' :
                                                'bg-amber-50 text-amber-600'
                                            }`}>{currentQuestion.difficulty}</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed">
                                        {currentQuestion.question}
                                    </h2>
                                    {/* MCQ Options */}
                                    {currentQuestion.type === 'mcq' && currentQuestion.options && (
                                        <div className="mt-4 space-y-2">
                                            {currentQuestion.options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setTextAnswer(opt)}
                                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${textAnswer === opt
                                                        ? 'border-primary bg-primary/5 text-primary font-medium'
                                                        : 'border-slate-100 bg-slate-50 hover:border-primary/30 text-slate-700'
                                                        }`}
                                                >
                                                    <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Feedback Panel */}
                        {showFeedback && (
                            <FeedbackPanel
                                evaluation={evaluations[currentIndex]}
                                onNext={handleNext}
                                isCoding={false}
                            />
                        )}

                        {/* Text/Voice Answer Input */}
                        {!showFeedback && currentQuestion.type !== 'mcq' && (
                            <div className="flex-1 flex flex-col gap-4 mb-6 min-h-[300px]">
                                {inputMode === 'text' ? (
                                    <TextMode answer={textAnswer} setAnswer={setTextAnswer} />
                                ) : (
                                    <VoiceMode
                                        transcript={speech.transcript}
                                        interimTranscript={speech.interimTranscript}
                                        isListening={speech.isListening}
                                        onStart={speech.start}
                                        onStop={speech.stop}
                                    />
                                )}
                            </div>
                        )}

                        {/* Bottom Actions */}
                        {!showFeedback && (
                            <div className="flex justify-between items-center pb-4">
                                <button
                                    onClick={handleSkip}
                                    className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <span className="material-icons-round text-lg">skip_next</span>
                                    Skip for now
                                </button>
                                <button
                                    onClick={handleSubmitAnswer}
                                    disabled={submitting || (!textAnswer.trim() && !speech.transcript.trim())}
                                    className={`font-bold px-8 py-3 rounded-lg shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5 ${submitting || (!textAnswer.trim() && !speech.transcript.trim())
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                        : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20 hover:shadow-primary/40'
                                        }`}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="material-icons-round text-sm animate-spin">sync</span>
                                            <span>Evaluating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Submit Answer</span>
                                            <span className="material-icons-round text-sm">send</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 p-4 md:p-8 md:pl-0 flex flex-col gap-6">
                        {/* Session Progress */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-900">Session Progress</h3>
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
                                <div className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="space-y-4">
                                {questions.map((q, i) => (
                                    <div key={i} className={`flex items-start gap-3 ${i > currentIndex ? 'opacity-40' : i < currentIndex ? 'opacity-60' : ''}`}>
                                        {i < currentIndex ? (
                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                <span className="material-icons-round text-sm">check</span>
                                            </div>
                                        ) : i === currentIndex ? (
                                            <div className="w-6 h-6 rounded-full border-2 border-primary bg-gray-50 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                                {i + 1}
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 text-xs font-medium flex-shrink-0">
                                                {i + 1}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-sm truncate ${i === currentIndex ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {q.topic || q.type || `Q${i + 1}`}
                                                </p>
                                                <ModeIcon mode={q.mode || 'text'} />
                                            </div>
                                            {i === currentIndex && (
                                                <p className="text-xs text-primary font-medium animate-pulse">In progress...</p>
                                            )}
                                            {i < currentIndex && evaluations[i] && (
                                                <p className={`text-xs font-medium ${evaluations[i].score >= 7 ? 'text-green-500' : evaluations[i].score >= 4 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    Score: {evaluations[i].score}/10
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* End Session */}
                        <Link to="/" className="w-full py-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                            <span className="material-icons-round text-lg">logout</span>
                            End Interview Session
                        </Link>
                    </aside>
                </div>
            )}
        </div>
    )
}
