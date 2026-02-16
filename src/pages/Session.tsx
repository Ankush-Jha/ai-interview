import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useInterview } from '@/hooks/useInterview'
import { useSpeechSynthesis, useSpeechRecognition } from '@/hooks/useSpeech'
import type { InterviewConfig, TranscriptEntry, Evaluation } from '@/types/interview'

const DEFAULT_CONFIG: InterviewConfig = {
    persona: 'socratic',
    difficulty: 'intermediate',
    questionCount: 5,
    questionTypes: ['conceptual', 'applied'],
}

// ── Timer Hook ─────────────────────────────────────────────────────
function useTimer(paused: boolean) {
    const [seconds, setSeconds] = useState(0)
    useEffect(() => {
        if (paused) return
        const id = setInterval(() => setSeconds((s) => s + 1), 1000)
        return () => clearInterval(id)
    }, [paused])
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
}

// ── Typing Animation Hook ──────────────────────────────────────────
function useTypingAnimation(text: string, speed = 18) {
    const [displayed, setDisplayed] = useState('')
    const [done, setDone] = useState(false)

    useEffect(() => {
        setDisplayed('')
        setDone(false)
        if (!text) return

        let i = 0
        const id = setInterval(() => {
            i++
            setDisplayed(text.slice(0, i))
            if (i >= text.length) {
                setDone(true)
                clearInterval(id)
            }
        }, speed)
        return () => clearInterval(id)
    }, [text, speed])

    return { displayed, done }
}

// ── Score Color ────────────────────────────────────────────────────
function scoreColor(score: number): string {
    if (score >= 80) return 'text-[--neo-primary]'
    if (score >= 50) return 'text-yellow-500'
    return 'text-[--neo-error]'
}

function scoreBg(score: number): string {
    if (score >= 80) return 'bg-[--neo-primary]'
    if (score >= 50) return 'bg-yellow-400'
    return 'bg-[--neo-error]'
}

// ── Feedback Card Component ────────────────────────────────────────
function FeedbackCard({ evaluation }: { evaluation: Evaluation }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="mt-3 space-y-2">
            {/* Score bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 neo-progress">
                    <div
                        className={`h-full ${scoreBg(evaluation.score)} transition-all duration-500`}
                        style={{ width: `${evaluation.score}%` }}
                    />
                </div>
                <span className={`font-display text-lg ${scoreColor(evaluation.score)}`}>
                    {evaluation.score}%
                </span>
            </div>

            {/* Expand toggle */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
                {expanded ? '▼ HIDE DETAILS' : '▶ SHOW DETAILS'}
            </button>

            {expanded && (
                <div className="space-y-3 pl-2 border-l-[2px] border-foreground/20">
                    {/* Detailed feedback */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {evaluation.feedback}
                    </p>

                    {/* Strengths */}
                    {evaluation.strengths.length > 0 && (
                        <div>
                            <p className="font-mono text-[10px] font-bold text-[--neo-primary] uppercase tracking-wider mb-1">
                                ✓ STRENGTHS
                            </p>
                            <ul className="space-y-1">
                                {evaluation.strengths.map((s, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                        <span className="text-[--neo-primary]">+</span>
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Gaps */}
                    {evaluation.gaps.length > 0 && (
                        <div>
                            <p className="font-mono text-[10px] font-bold text-[--neo-error] uppercase tracking-wider mb-1">
                                ✗ GAPS
                            </p>
                            <ul className="space-y-1">
                                {evaluation.gaps.map((g, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                        <span className="text-[--neo-error]">−</span>
                                        {g}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── AI Orb Component ───────────────────────────────────────────────
function AIOrb({ state }: { state: 'idle' | 'speaking' | 'thinking' | 'listening' }) {
    const orbAnimClass = state === 'speaking' ? 'orb-speaking'
        : state === 'thinking' ? 'orb-thinking'
            : state === 'listening' ? 'orb-listening'
                : 'orb-idle'

    const bg = state === 'speaking'
        ? 'linear-gradient(135deg, #7c3aed, #ec4899)'
        : state === 'thinking'
            ? 'linear-gradient(135deg, #f59e0b, #ec4899, #7c3aed)'
            : state === 'listening'
                ? 'linear-gradient(135deg, #3b82f6, #14b8a6)'
                : 'linear-gradient(135deg, #b9f20d, #14b8a6)'

    const icon = state === 'thinking' ? '◆' : state === 'listening' ? '◉' : state === 'speaking' ? '▶' : '●'

    return (
        <div className={`relative w-14 h-14 ${orbAnimClass}`}>
            <div
                className="absolute inset-0 rounded-full border-[3px] border-foreground flex items-center justify-center"
                style={{ background: bg }}
            >
                <span className="font-display text-lg text-white drop-shadow-md">
                    {icon}
                </span>
            </div>
            {state === 'speaking' && (
                <div className="absolute -inset-1 rounded-full border-[2px] border-[--neo-violet] opacity-40 animate-ping" />
            )}
            {state === 'listening' && (
                <div className="absolute -inset-1 rounded-full border-[2px] border-[--neo-blue] opacity-40 animate-ping" />
            )}
            {state === 'thinking' && (
                <div className="absolute -inset-2 rounded-full border-[2px] border-dashed border-[--neo-gold] opacity-60 animate-spin" style={{ animationDuration: '3s' }} />
            )}
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────
export default function Session() {
    const { id } = useParams<{ id: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const scrollRef = useRef<HTMLDivElement>(null)

    const config: InterviewConfig =
        (location.state as { config?: InterviewConfig } | null)?.config ??
        DEFAULT_CONFIG

    const {
        session,
        phase,
        error,
        currentQuestion,
        latestEvaluation,
        progress,
        transcript,
        initialize,
        startInterview,
        submitAnswer,
        nextQuestion,
        resetSession,
    } = useInterview(id ?? '', config)

    // Speech hooks
    const tts = useSpeechSynthesis()
    const stt = useSpeechRecognition()

    const timerPaused = phase === 'loading' || phase === 'evaluating' || phase === 'greeting'
    const elapsed = useTimer(timerPaused)
    const [answerText, setAnswerText] = useState('')
    const [confirmEnd, setConfirmEnd] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)

    // Determine AI orb state
    const orbState = phase === 'evaluating' ? 'thinking'
        : tts.isSpeaking ? 'speaking'
            : stt.isListening ? 'listening'
                : phase === 'greeting' ? 'speaking'
                    : 'idle'

    useEffect(() => {
        if (id) initialize()
    }, [id])

    // Clear answer text on phase changes
    useEffect(() => {
        if (phase === 'ready' || phase === 'follow-up') {
            setAnswerText('')
            stt.clearTranscript()
        }
    }, [phase, currentQuestion])

    // Auto-speak new AI transcript entries
    useEffect(() => {
        if (!tts.enabled || transcript.length === 0) return
        const last = transcript[transcript.length - 1]
        if (!last || last.role !== 'ai') return
        if (['question', 'greeting', 'feedback', 'follow-up', 'closing'].includes(last.type)) {
            tts.speak(last.text)
        }
    }, [transcript.length, tts.enabled])

    // Sync speech recognition transcript to answer text
    useEffect(() => {
        if (stt.liveTranscript) {
            setAnswerText(stt.liveTranscript)
        }
    }, [stt.liveTranscript])

    // Auto-scroll transcript
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [transcript, phase])

    const handleSubmit = useCallback(async () => {
        if (!answerText.trim() || phase === 'evaluating') return
        if (stt.isListening) stt.stopListening()
        await submitAnswer(answerText)
    }, [answerText, phase, submitAnswer, stt])

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSubmit()
        }
    }

    function handleMicToggle() {
        if (stt.isListening) {
            stt.stopListening()
        } else {
            stt.clearTranscript()
            stt.startListening()
        }
    }

    function handleReset() {
        tts.stop()
        if (stt.isListening) stt.stopListening()
        resetSession()
        setConfirmReset(false)
        setTimeout(() => initialize(), 100)
    }

    // ── Loading ────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="neo-card p-8 text-center space-y-4 max-w-md">
                    <AIOrb state="thinking" />
                    <h2 className="font-display text-2xl mt-4">PREPARING_SESSION</h2>
                    <p className="font-mono text-xs text-muted-foreground">
                        Analyzing your document and crafting questions...
                    </p>
                    <div className="flex justify-center gap-1 h-6 items-end">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="audio-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ── Error ──────────────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="neo-card p-8 max-w-md text-center space-y-4">
                    <h2 className="font-display text-2xl text-[--neo-error]">ERROR_ENCOUNTERED</h2>
                    <p className="font-mono text-xs text-muted-foreground">
                        {error || 'An unexpected error occurred'}
                    </p>
                    <div className="flex justify-center gap-3">
                        <button onClick={() => navigate('/')} className="btn-neo bg-background px-6 py-2 font-mono text-xs font-bold">
                            [BACK]
                        </button>
                        <button onClick={handleReset} className="btn-neo bg-[--neo-primary] px-6 py-2 font-mono text-xs font-bold">
                            [RETRY]
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Greeting Phase ─────────────────────────────────────────────
    if (phase === 'greeting') {
        const greetingEntry = transcript.find((t) => t.type === 'greeting')
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="neo-card p-8 max-w-lg text-center space-y-6">
                    <div className="flex justify-center">
                        <AIOrb state="speaking" />
                    </div>
                    <h2 className="font-display text-2xl">HELLO!</h2>
                    {greetingEntry && (
                        <TypingText text={greetingEntry.text} />
                    )}
                    <button
                        onClick={startInterview}
                        className="btn-neo bg-[--neo-primary] px-10 py-3 font-mono text-sm font-bold"
                    >
                        [LET'S GO!] →
                    </button>
                </div>
            </div>
        )
    }

    // ── Completed ──────────────────────────────────────────────────
    if (phase === 'completed' && session) {
        const avgScore =
            session.evaluations.length > 0
                ? Math.round(session.evaluations.reduce((s, e) => s + e.score, 0) / session.evaluations.length)
                : 0

        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="neo-card p-8 max-w-2xl w-full space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-20 h-20 mx-auto bg-[--neo-primary] border-[3px] border-foreground shadow-hard-sm flex items-center justify-center">
                            <span className="font-display text-3xl">✓</span>
                        </div>
                        <h2 className="font-display text-3xl">SESSION_COMPLETE</h2>
                        <p className="font-mono text-xs text-muted-foreground">
                            {session.answers.length} answers • {elapsed} elapsed
                        </p>
                    </div>

                    {/* Score summary */}
                    <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                            <p className={`font-display text-5xl ${scoreColor(avgScore)}`}>{avgScore}%</p>
                            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">AVG SCORE</p>
                        </div>
                        <div className="w-px h-14 bg-foreground" />
                        <div className="text-center">
                            <p className="font-display text-5xl">{elapsed}</p>
                            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">DURATION</p>
                        </div>
                    </div>

                    {/* Per-question breakdown */}
                    <div className="space-y-2">
                        <h3 className="font-display text-sm">QUESTION_BREAKDOWN</h3>
                        <div className="space-y-2">
                            {session.questions.map((q, i) => {
                                const ev = session.evaluations.find(e => e.questionId === q.id)
                                return (
                                    <div key={i} className="neo-card-sm p-3 flex items-center gap-3">
                                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold border-[2px] border-foreground ${ev ? scoreBg(ev.score) : 'bg-muted'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs truncate">{q.text}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground uppercase">
                                                {q.type} • {q.topicName}
                                            </p>
                                        </div>
                                        {ev && (
                                            <span className={`font-display text-lg ${scoreColor(ev.score)}`}>
                                                {ev.score}%
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="btn-neo bg-background flex-1 py-3 font-mono text-xs font-bold"
                        >
                            [DASHBOARD]
                        </button>
                        <button
                            onClick={handleReset}
                            className="btn-neo bg-[--neo-primary] flex-1 py-3 font-mono text-xs font-bold"
                        >
                            [TRY AGAIN] ↻
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Guard ──────────────────────────────────────────────────────
    if (!session || !currentQuestion) return null

    // ── In-Progress Render ─────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
            {/* ── Left: Transcript ── */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Title bar */}
                <div className="px-6 py-4 border-b-[3px] border-foreground bg-card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <AIOrb state={orbState as 'idle' | 'speaking' | 'thinking' | 'listening'} />
                        <div>
                            <h1 className="font-display text-lg">
                                {session.followUpPending ? 'FOLLOW_UP' : `Q${session.currentQuestionIndex + 1}/${progress.total}`}
                            </h1>
                            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                                {currentQuestion.type} • {currentQuestion.topicName} • {elapsed}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="neo-badge bg-[--neo-primary]">
                            {session.config?.difficulty || 'INTERMEDIATE'}
                        </div>
                        <div className="neo-badge bg-background">
                            {session.config?.persona || 'SOCRATIC'}
                        </div>
                    </div>
                </div>

                {/* Transcript area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
                    {transcript.map((entry) => (
                        <TranscriptBubble key={entry.id} entry={entry} />
                    ))}

                    {/* Evaluating indicator */}
                    {phase === 'evaluating' && (
                        <div className="flex gap-3 fade-slide-up">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-display text-xs text-white border-[2px] border-[--neo-violet]" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                                AI
                            </div>
                            <div className="neo-card-sm p-4" style={{ borderColor: 'var(--neo-violet)', boxShadow: '4px 4px 0px 0px var(--neo-violet)' }}>
                                <div className="flex gap-[3px] h-6 items-end">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                                <p className="font-mono text-[10px] mt-2" style={{ color: 'var(--neo-violet)' }}>ANALYZING YOUR ANSWER...</p>
                            </div>
                        </div>
                    )}

                    {/* STT Processing indicator */}
                    {stt.isProcessing && (
                        <div className="flex items-center gap-2 px-4 py-2 fade-slide-up">
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="process-dot" style={{ animationDelay: `${i * 0.3}s` }} />
                                ))}
                            </div>
                            <span className="font-mono text-[10px]" style={{ color: 'var(--neo-violet)' }}>TRANSCRIBING...</span>
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div className="border-t-[3px] border-foreground bg-card">
                    {phase === 'showing-feedback' ? (
                        <div className="p-4 flex justify-center">
                            <button
                                onClick={nextQuestion}
                                className="btn-neo bg-[--neo-primary] px-8 py-3 font-mono text-sm font-bold"
                            >
                                [NEXT QUESTION] →
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-end gap-3 p-4">
                            {/* Mic button */}
                            {stt.supported && stt.enabled && (
                                <button
                                    onClick={handleMicToggle}
                                    className={`btn-neo flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${stt.isListening
                                        ? 'mic-recording text-white border-[--neo-error]'
                                        : 'bg-background hover:bg-[--neo-blue] hover:text-white hover:border-[--neo-blue]'
                                        }`}
                                    title={stt.isListening ? 'Stop recording' : 'Start voice input'}
                                >
                                    {stt.isListening ? (
                                        <span className="flex gap-[2px] items-end h-4">
                                            {[0, 1, 2, 3].map(i => (
                                                <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.15}s`, background: 'white', width: '2px' }} />
                                            ))}
                                        </span>
                                    ) : '🎤'}
                                </button>
                            )}
                            <div className="flex-1 relative">
                                <textarea
                                    className="neo-input w-full p-3 text-sm resize-none min-h-[60px] max-h-[150px]"
                                    placeholder={
                                        stt.isListening
                                            ? "🎤 Listening... speak your answer"
                                            : session.followUpPending
                                                ? "Answer the follow-up... (⌘+Enter to submit)"
                                                : "Type your answer... (⌘+Enter to submit)"
                                    }
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    disabled={phase === 'evaluating' || phase === 'completed'}
                                    onKeyDown={handleKeyDown}
                                    rows={2}
                                    style={stt.isListening ? { borderColor: 'var(--neo-blue)', boxShadow: '4px 4px 0px 0px var(--neo-blue)' } : {}}
                                />
                                {tts.isSpeaking && (
                                    <div className="absolute top-1 right-2 flex gap-[2px] items-end h-3">
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.12}s`, width: '2px', height: '3px' }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={!answerText.trim() || phase === 'evaluating'}
                                className="btn-neo px-6 py-3 font-mono text-xs font-bold flex-shrink-0 disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #b9f20d, #14b8a6)', color: '#000' }}
                            >
                                [SUBMIT] →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right: Session Info ── */}
            <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 border-l-[3px] border-foreground bg-card flex flex-col overflow-y-auto">
                {/* Progress */}
                <div className="p-5 border-b-[3px] border-foreground">
                    <h3 className="font-display text-sm mb-3">PROGRESS</h3>
                    <div className="neo-progress mb-2">
                        <div
                            className="neo-progress-fill"
                            style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                        />
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">
                        {progress.current} OF {progress.total} ANSWERED
                    </p>
                    {progress.score > 0 && (
                        <p className={`font-mono text-[10px] font-bold mt-1 ${scoreColor(progress.score)}`}>
                            AVG: {progress.score}%
                        </p>
                    )}
                </div>

                {/* Question list */}
                <div className="p-5 border-b-[3px] border-foreground flex-1">
                    <h3 className="font-display text-sm mb-4">QUESTIONS</h3>
                    <div className="space-y-3">
                        {session.questions.map((q, i) => {
                            const ev = session.evaluations.find(e => e.questionId === q.id)
                            const isCurrent = i === session.currentQuestionIndex
                            const isCompleted = !!ev
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-7 h-7 flex items-center justify-center font-mono text-xs font-bold border-[2px] ${isCompleted
                                        ? `${scoreBg(ev.score)} border-foreground`
                                        : isCurrent
                                            ? 'border-[--neo-primary] bg-transparent text-[--neo-primary]'
                                            : 'border-muted-foreground/30 text-muted-foreground/30'
                                        }`}>
                                        {isCompleted ? '✓' : i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-mono text-[10px] uppercase tracking-wider ${isCurrent ? 'font-bold' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
                                            }`}>
                                            {q.type} • {q.topicName}
                                        </p>
                                        {isCompleted && ev && (
                                            <p className={`font-mono text-[10px] font-bold ${scoreColor(ev.score)}`}>
                                                {ev.score}%
                                            </p>
                                        )}
                                        {isCurrent && !isCompleted && (
                                            <p className="font-mono text-[10px] text-muted-foreground animate-pulse">
                                                {session.followUpPending ? 'FOLLOW-UP...' : 'IN PROGRESS...'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Stats */}
                <div className="p-5 border-b-[3px] border-foreground">
                    <h3 className="font-display text-sm mb-3">STATS</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between font-mono text-xs">
                            <span className="text-muted-foreground">ELAPSED</span>
                            <span className="font-bold">{elapsed}</span>
                        </div>
                        <div className="flex justify-between font-mono text-xs">
                            <span className="text-muted-foreground">REMAINING</span>
                            <span className="font-bold">{progress.total - (session.currentQuestionIndex + 1)}</span>
                        </div>
                        <div className="flex justify-between font-mono text-xs">
                            <span className="text-muted-foreground">DIFFICULTY</span>
                            <span className="font-bold uppercase">{session.config.difficulty}</span>
                        </div>
                        {latestEvaluation && (
                            <div className="flex justify-between font-mono text-xs">
                                <span className="text-muted-foreground">LAST SCORE</span>
                                <span className={`font-bold ${scoreColor(latestEvaluation.score)}`}>{latestEvaluation.score}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Voice Controls */}
                <div className="p-5 border-b-[3px] border-foreground">
                    <h3 className="font-display text-sm mb-3 gradient-text">VOICE</h3>
                    <div className="space-y-2">
                        <button
                            onClick={tts.toggleEnabled}
                            className={`btn-neo w-full py-2 font-mono text-[10px] font-bold transition-all ${tts.enabled
                                ? 'text-white border-[--neo-violet]'
                                : 'bg-background'
                                }`}
                            style={tts.enabled ? { background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '4px 4px 0px 0px #7c3aed' } : {}}
                        >
                            {tts.enabled ? '🔊 SPEAKER ON' : '🔇 SPEAKER OFF'}
                        </button>
                        {tts.enabled && (
                            <p className="font-mono text-[9px] text-center" style={{ color: 'var(--neo-violet)' }}>
                                ⚡ {tts.engine === 'elevenlabs' ? 'ElevenLabs AI' : 'Browser TTS'}
                            </p>
                        )}
                        <button
                            onClick={stt.toggleEnabled}
                            className={`btn-neo w-full py-2 font-mono text-[10px] font-bold transition-all ${stt.enabled
                                ? 'text-white border-[--neo-blue]'
                                : 'bg-background'
                                }`}
                            style={stt.enabled ? { background: 'linear-gradient(135deg, #3b82f6, #14b8a6)', boxShadow: '4px 4px 0px 0px #3b82f6' } : {}}
                        >
                            {stt.enabled ? '🎤 MIC ON' : '🎤 MIC OFF'}
                        </button>
                        {stt.enabled && (
                            <p className="font-mono text-[9px] text-center" style={{ color: 'var(--neo-blue)' }}>
                                ⚡ {stt.engine === 'groq-whisper' ? 'Groq Whisper AI' : 'Browser STT'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Session controls */}
                <div className="p-5 space-y-3">
                    {/* Reset */}
                    {confirmReset ? (
                        <div className="space-y-2">
                            <p className="font-mono text-xs text-muted-foreground font-bold">RESET SESSION?</p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmReset(false)} className="btn-neo bg-background flex-1 py-2 font-mono text-[10px] font-bold">
                                    [CANCEL]
                                </button>
                                <button onClick={handleReset} className="btn-neo bg-[--neo-primary] flex-1 py-2 font-mono text-[10px] font-bold">
                                    [RESET] ↻
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmReset(true)}
                            className="btn-neo bg-background w-full py-2 font-mono text-[10px] font-bold"
                        >
                            [RESET SESSION] ↻
                        </button>
                    )}

                    {/* End session */}
                    {confirmEnd ? (
                        <div className="space-y-2">
                            <p className="font-mono text-xs text-[--neo-error] font-bold">END SESSION EARLY?</p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmEnd(false)} className="btn-neo bg-background flex-1 py-2 font-mono text-[10px] font-bold">
                                    [CANCEL]
                                </button>
                                <button onClick={() => navigate('/')} className="btn-neo bg-[--neo-error] text-white flex-1 py-2 font-mono text-[10px] font-bold">
                                    [END NOW]
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmEnd(true)}
                            className="btn-neo bg-background w-full py-2 font-mono text-[10px] font-bold text-[--neo-error] border-[--neo-error]"
                            style={{ boxShadow: '4px 4px 0px 0px var(--neo-error)' }}
                        >
                            [END SESSION]
                        </button>
                    )}
                </div>
            </aside>
        </div>
    )
}

// ── Typing Text Component ──────────────────────────────────────────
function TypingText({ text }: { text: string }) {
    const { displayed, done } = useTypingAnimation(text, 20)
    return (
        <p className="text-sm leading-relaxed max-w-md mx-auto">
            {displayed}
            {!done && <span className="animate-pulse">▊</span>}
        </p>
    )
}

// ── Transcript Bubble ──────────────────────────────────────────────
function TranscriptBubble({ entry }: { entry: TranscriptEntry }) {
    const isUser = entry.role === 'user'
    const isFollowUp = entry.type === 'follow-up'
    const isTransition = entry.type === 'transition'
    const isFeedback = entry.type === 'feedback'
    const isQuestion = entry.type === 'question'

    // AI label
    const aiLabel = isFollowUp ? '↪' : isTransition ? '→' : isFeedback ? '📝' : isQuestion ? 'Q' : 'AI'

    if (isUser) {
        return (
            <div className="flex gap-3 justify-end">
                <div className="max-w-[75%] bg-muted border-[2px] border-foreground p-4">
                    <p className="text-sm leading-relaxed">{entry.text}</p>
                    <p className="font-mono text-[9px] text-muted-foreground mt-2 uppercase tracking-wider">
                        {formatTimeShort(entry.timestamp)}
                    </p>
                </div>
                <div className="w-8 h-8 bg-muted border-[2px] border-foreground flex-shrink-0 flex items-center justify-center font-display text-xs">
                    U
                </div>
            </div>
        )
    }

    return (
        <div className={`flex gap-3 ${isTransition ? 'opacity-70' : ''}`}>
            <div className={`w-8 h-8 ${isFeedback ? 'bg-background' : 'bg-[--neo-primary]'} border-[2px] border-foreground flex-shrink-0 flex items-center justify-center font-display text-xs`}>
                {aiLabel}
            </div>
            <div className={`max-w-[75%] ${isTransition ? 'p-2' : 'neo-card-sm p-4'}`}>
                {isTransition ? (
                    <p className="text-xs italic text-muted-foreground">{entry.text}</p>
                ) : (
                    <>
                        {isFollowUp && (
                            <p className="font-mono text-[9px] text-[--neo-primary] font-bold uppercase tracking-wider mb-1">
                                FOLLOW-UP QUESTION
                            </p>
                        )}
                        {isQuestion && (
                            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                                QUESTION
                            </p>
                        )}
                        <p className="text-sm leading-relaxed">{entry.text}</p>

                        {/* Show feedback card if this is a feedback entry with evaluation */}
                        {isFeedback && entry.evaluation && (
                            <FeedbackCard evaluation={entry.evaluation} />
                        )}

                        <p className="font-mono text-[9px] text-muted-foreground mt-2 uppercase tracking-wider">
                            {formatTimeShort(entry.timestamp)}
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}

function formatTimeShort(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
