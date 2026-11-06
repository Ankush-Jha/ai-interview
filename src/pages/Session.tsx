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
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
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

// ── Score helpers ──────────────────────────────────────────────────
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

// ── Feedback Card ──────────────────────────────────────────────────
function FeedbackCard({ evaluation }: { evaluation: Evaluation }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="mt-3 space-y-2">
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
            <button
                onClick={() => setExpanded(!expanded)}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
                {expanded ? '▼ HIDE DETAILS' : '▶ SHOW DETAILS'}
            </button>
            {expanded && (
                <div className="space-y-3 pl-2 border-l-[2px] border-foreground/20">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {evaluation.feedback}
                    </p>
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

// ── Large AI Orb ───────────────────────────────────────────────────
function LargeOrb({ state }: { state: 'idle' | 'speaking' | 'thinking' | 'listening' }) {
    const animClass = state === 'speaking' ? 'orb-speaking'
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

    const label = state === 'speaking' ? 'SPEAKING'
        : state === 'thinking' ? 'ANALYZING'
            : state === 'listening' ? 'LISTENING'
                : 'READY'

    return (
        <div className="flex flex-col items-center gap-4">
            <div className={`orb-large ${animClass}`} style={{ background: bg, borderColor: '#000' }}>
                <div className="absolute inset-0 rounded-full flex items-center justify-center">
                    <span className="font-display text-3xl text-white drop-shadow-md">
                        {state === 'thinking' ? '◆' : state === 'listening' ? '◉' : state === 'speaking' ? '▶' : '●'}
                    </span>
                </div>
                {state === 'speaking' && (
                    <div className="absolute -inset-2 rounded-full border-[2px] border-[--neo-violet] opacity-30 animate-ping" />
                )}
                {state === 'listening' && (
                    <div className="absolute -inset-2 rounded-full border-[2px] border-[--neo-blue] opacity-30 animate-ping" />
                )}
                {state === 'thinking' && (
                    <div className="absolute -inset-3 rounded-full border-[2px] border-dashed border-[--neo-gold] opacity-50 animate-spin" style={{ animationDuration: '3s' }} />
                )}
            </div>
            <span className="font-mono text-xs font-bold tracking-widest uppercase">{label}</span>
            {(state === 'speaking' || state === 'listening') && (
                <div className="avatar-waveform">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bar" style={{ height: `${20 + Math.random() * 20}px` }} />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Small Orb (for left panel header) ──────────────────────────────
function SmallOrb({ state }: { state: 'idle' | 'speaking' | 'thinking' | 'listening' }) {
    const animClass = state === 'speaking' ? 'orb-speaking' : state === 'thinking' ? 'orb-thinking' : state === 'listening' ? 'orb-listening' : 'orb-idle'
    const bg = state === 'speaking' ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : state === 'listening' ? 'linear-gradient(135deg, #3b82f6, #14b8a6)' : 'linear-gradient(135deg, #b9f20d, #14b8a6)'
    return (
        <div className={`w-3 h-3 rounded-full ${animClass}`} style={{ background: bg }} />
    )
}

// ── Transcript Tag ─────────────────────────────────────────────────
function TranscriptTag({ entry }: { entry: TranscriptEntry }) {
    const time = new Date(entry.timestamp)
    const ts = `${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`

    if (entry.role === 'user') {
        return <span className="tag-user">USER__{ts}</span>
    }

    const prefix = entry.type === 'feedback' ? 'SYS__EVAL' : entry.type === 'follow-up' ? 'SYS__FU' : 'SYS__AI'
    return <span className="tag-sys">{prefix}__{ts}</span>
}

// ════════════════════════════════════════════════════════════════════
//  MAIN SESSION COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function Session() {
    const { id } = useParams<{ id: string }>()
    const location = useLocation()
    const navigate = useNavigate()
    const scrollRef = useRef<HTMLDivElement>(null)
    const autoVoiceRef = useRef(true) // auto-voice mode flag

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
    const [codeText, setCodeText] = useState('')
    const [confirmEnd, setConfirmEnd] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)

    // Is current question a coding question?
    const isCodingQ = currentQuestion?.type === 'coding'

    // Determine AI orb state
    const orbState: 'idle' | 'speaking' | 'thinking' | 'listening' =
        phase === 'evaluating' ? 'thinking'
            : tts.isSpeaking ? 'speaking'
                : stt.isListening ? 'listening'
                    : phase === 'greeting' ? 'speaking'
                        : 'idle'

    // ── Initialization ────────────────────────────────────────────
    useEffect(() => {
        if (id) initialize()
    }, [id])

    // ── Start voice interview (user gesture required for browser audio) ──
    const handleStartVoiceInterview = useCallback(() => {
        // Enable TTS + STT (user click unlocks browser audio permissions)
        if (!tts.enabled) tts.toggleEnabled()
        if (!stt.enabled) stt.toggleEnabled()
        // Speak the greeting immediately
        const greetingEntry = transcript.find((t) => t.type === 'greeting')
        if (greetingEntry) {
            // Speak immediately with force=true (enabled state hasn't propagated yet)
            setTimeout(() => tts.speak(greetingEntry.text, true), 50)
        }
    }, [tts, stt, transcript])

    // ── Clear answer on phase changes ─────────────────────────────
    useEffect(() => {
        if (phase === 'ready' || phase === 'follow-up') {
            setAnswerText('')
            stt.clearTranscript()
        }
    }, [phase, currentQuestion])

    // ── Auto-speak AI transcript entries (skip greeting — handled by button click) ──
    useEffect(() => {
        if (!tts.enabled || transcript.length === 0) return
        const last = transcript[transcript.length - 1]
        if (!last || last.role !== 'ai') return
        // Skip greeting — it's spoken by the start button
        if (last.type === 'greeting') return
        if (['question', 'feedback', 'follow-up', 'closing', 'transition'].includes(last.type)) {
            tts.speak(last.text)
        }
    }, [transcript.length, tts.enabled])

    // ── Auto-start interview after greeting speaks ────────────────
    useEffect(() => {
        if (phase === 'greeting' && tts.enabled) {
            tts.setOnSpeakEnd(() => {
                // After greeting finishes, auto-start the interview
                setTimeout(() => startInterview(), 500)
            })
        } else if (phase === 'ready' || phase === 'awaiting-answer' || phase === 'follow-up') {
            // After question is spoken, auto-start listening
            tts.setOnSpeakEnd(() => {
                if (autoVoiceRef.current && stt.enabled && !isCodingQ) {
                    setTimeout(() => {
                        stt.clearTranscript()
                        stt.startListening()
                    }, 600)
                }
            })
        } else if (phase === 'showing-feedback') {
            // After feedback is spoken, auto-advance to next question
            tts.setOnSpeakEnd(() => {
                setTimeout(() => nextQuestion(), 800)
            })
        } else {
            tts.setOnSpeakEnd(null)
        }
    }, [phase, tts.enabled, stt.enabled, isCodingQ])

    // ── Auto-submit after STT transcription completes ─────────────
    useEffect(() => {
        if (autoVoiceRef.current && stt.enabled) {
            stt.setOnTranscriptReady((text: string) => {
                if (text.trim() && (phase === 'awaiting-answer' || phase === 'follow-up' || phase === 'ready')) {
                    // Auto-submit the voice answer
                    submitAnswer(text.trim())
                }
            })
        }
        return () => stt.setOnTranscriptReady(null)
    }, [stt.enabled, phase, submitAnswer])

    // ── Sync STT to answer text ───────────────────────────────────
    useEffect(() => {
        if (stt.liveTranscript) {
            setAnswerText(stt.liveTranscript)
        }
    }, [stt.liveTranscript])

    // ── Auto-scroll ───────────────────────────────────────────────
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [transcript, phase])

    // ── Handlers ──────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        const text = isCodingQ ? codeText : answerText
        if (!text.trim() || phase === 'evaluating') return
        if (stt.isListening) stt.stopListening()
        await submitAnswer(text)
    }, [answerText, codeText, isCodingQ, phase, submitAnswer, stt])


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
        setCodeText('')
        setTimeout(() => initialize(), 100)
    }

    // ── LOADING ────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="flex-1 flex items-center justify-center bg-blueprint h-full">
                <div className="neo-card p-8 text-center space-y-4 max-w-md">
                    <LargeOrb state="thinking" />
                    <h2 className="font-display text-2xl mt-4">PREPARING_SESSION</h2>
                    <p className="font-mono text-xs text-muted-foreground">
                        Analyzing your document and crafting questions...
                    </p>
                    <div className="avatar-waveform">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bar" style={{ height: `${10 + i * 4}px` }} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ── ERROR ──────────────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <div className="flex-1 flex items-center justify-center bg-blueprint h-full">
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

    // ── GREETING (one-click to unlock audio + start auto-flow) ─────
    if (phase === 'greeting') {
        const greetingEntry = transcript.find((t) => t.type === 'greeting')
        return (
            <div className="flex-1 flex items-center justify-center bg-blueprint h-full">
                <div className="neo-card p-10 max-w-lg text-center space-y-6">
                    <LargeOrb state={tts.isSpeaking ? 'speaking' : 'idle'} />
                    {greetingEntry && <TypingText text={greetingEntry.text} />}
                    {!tts.isSpeaking && (
                        <button
                            onClick={handleStartVoiceInterview}
                            className="btn-neo bg-[--neo-primary] px-10 py-4 font-display text-lg uppercase tracking-wide border-6 border-black hover:bg-black hover:text-[--neo-primary] transition-colors stripe-pattern"
                        >
                            ▶ BEGIN INTERVIEW
                        </button>
                    )}
                    {tts.isSpeaking && (
                        <p className="font-mono text-[10px] text-muted-foreground animate-pulse uppercase tracking-widest">
                            AI is speaking...
                        </p>
                    )}
                </div>
            </div>
        )
    }

    // ── COMPLETED ─────────────────────────────────────────────────
    if (phase === 'completed' && session) {
        const avgScore =
            session.evaluations.length > 0
                ? Math.round(session.evaluations.reduce((s, e) => s + e.score, 0) / session.evaluations.length)
                : 0

        return (
            <div className="flex-1 flex items-center justify-center bg-blueprint h-full">
                <div className="neo-card p-8 max-w-2xl w-full space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-20 h-20 mx-auto bg-[--neo-primary] border-6 border-foreground flex items-center justify-center">
                            <span className="font-display text-3xl">✓</span>
                        </div>
                        <h2 className="font-display text-3xl">SESSION_COMPLETE</h2>
                        <p className="font-mono text-xs text-muted-foreground">
                            {session.answers.length} answers • {elapsed} elapsed
                        </p>
                    </div>
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
                    <div className="space-y-2">
                        <h3 className="font-display text-sm">QUESTION_BREAKDOWN</h3>
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
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/')} className="btn-neo bg-background flex-1 py-3 font-mono text-xs font-bold">
                            [DASHBOARD]
                        </button>
                        <button onClick={handleReset} className="btn-neo bg-[--neo-primary] flex-1 py-3 font-mono text-xs font-bold">
                            [TRY AGAIN] ↻
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Guard ──────────────────────────────────────────────────────
    if (!session || !currentQuestion) return null

    // ════════════════════════════════════════════════════════════════
    //  IN-PROGRESS: Blueprint Grid Two-Panel Layout
    // ════════════════════════════════════════════════════════════════
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-blueprint">
            {/* ═══ HEADER ═══ */}
            <header className="h-16 flex-none border-b-6 border-black bg-white dark:bg-card flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-black dark:bg-[--neo-primary]" />
                    <h1 className="font-display text-xl tracking-tighter uppercase hidden md:block">
                        INTERVIEW_V{session.config.questionCount}
                    </h1>
                    <div className="flex gap-1.5">
                        <span className="bg-[--neo-primary] text-black text-[9px] font-bold px-2 py-0.5 border border-black font-mono uppercase">
                            {session.config.difficulty}
                        </span>
                        <span className="bg-white dark:bg-card text-[9px] font-bold px-2 py-0.5 border border-black font-mono uppercase">
                            {session.config.persona}
                        </span>
                    </div>
                </div>

                {/* Centered timer */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-[-4px] font-mono">
                        Time Elapsed
                    </span>
                    <div className="font-display text-2xl md:text-3xl tracking-tight">{elapsed}</div>
                </div>

                {/* End session */}
                {confirmEnd ? (
                    <div className="flex gap-2">
                        <button onClick={() => setConfirmEnd(false)} className="bg-white dark:bg-card border-4 border-black px-3 py-1 font-display text-xs uppercase">Cancel</button>
                        <button onClick={() => navigate('/')} className="bg-[--neo-error] text-white border-4 border-black px-3 py-1 font-display text-xs uppercase">End Now</button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmEnd(true)}
                        className="bg-white dark:bg-card border-4 border-black px-4 py-2 hover:bg-[--neo-error] hover:text-white transition-colors font-display text-sm uppercase"
                    >
                        End_Session
                    </button>
                )}
            </header>

            {/* ═══ BODY: Two-Panel ═══ */}
            <main className="flex-1 flex overflow-hidden">

                {/* ─── LEFT PANEL: Transcript + AI Avatar ─── */}
                <aside className="w-full md:w-[30%] flex flex-col border-r-6 border-black bg-white dark:bg-card relative z-10 h-full">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Transcript header */}
                        <div className="p-3 border-b-6 border-black bg-[--neo-primary] flex justify-between items-center">
                            <span className="font-display text-base uppercase">Transcript_Log</span>
                            <SmallOrb state={orbState} />
                        </div>

                        {/* Transcript scroll area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-card relative blueprint-scroll">
                            <div className="absolute inset-0 bg-blueprint opacity-20 pointer-events-none" />
                            <div className="relative z-10 space-y-4">
                                {transcript.map((entry) => (
                                    <TranscriptLine key={entry.id} entry={entry} />
                                ))}

                                {/* Thinking indicator */}
                                {phase === 'evaluating' && (
                                    <div className="flex flex-col gap-1 fade-slide-up">
                                        <span className="tag-sys">SYS__EVAL</span>
                                        <div className="border-l-4 border-[--neo-violet] bg-[--neo-violet]/10 pl-3 py-2">
                                            <div className="flex gap-[3px] h-4 items-end">
                                                {[...Array(6)].map((_, i) => (
                                                    <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                                                ))}
                                            </div>
                                            <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--neo-violet)' }}>ANALYZING...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Transcribing indicator */}
                                {stt.isProcessing && (
                                    <div className="flex items-center gap-2 pl-4 py-1 fade-slide-up">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map((i) => (
                                                <div key={i} className="process-dot" style={{ animationDelay: `${i * 0.3}s` }} />
                                            ))}
                                        </div>
                                        <span className="font-mono text-[10px]" style={{ color: 'var(--neo-blue)' }}>TRANSCRIBING...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reply input */}
                        <div className="p-3 border-t-6 border-black bg-white dark:bg-card z-20">
                            <div className="relative flex items-center gap-2">
                                {stt.supported && stt.enabled && (
                                    <button
                                        onClick={handleMicToggle}
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm border-[3px] border-black transition-all ${stt.isListening
                                            ? 'mic-recording text-white'
                                            : 'bg-white dark:bg-card hover:bg-[--neo-blue] hover:text-white'
                                            }`}
                                    >
                                        {stt.isListening ? (
                                            <span className="flex gap-[2px] items-end h-3">
                                                {[0, 1, 2].map(i => (
                                                    <span key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.15}s`, background: 'white', width: '2px' }} />
                                                ))}
                                            </span>
                                        ) : '🎤'}
                                    </button>
                                )}
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-base">&gt;</span>
                                    {!isCodingQ && (
                                        <input
                                            className="w-full bg-neutral-100 dark:bg-neutral-800 border-4 border-black h-10 pl-8 pr-3 font-mono text-sm focus:outline-none blueprint-input transition-colors placeholder:text-neutral-400"
                                            placeholder={stt.isListening ? 'LISTENING...' : 'REPLY_TO_SYSTEM...'}
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            disabled={phase === 'evaluating' || phase === 'completed'}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
                                        />
                                    )}
                                    {isCodingQ && (
                                        <input
                                            className="w-full bg-neutral-100 dark:bg-neutral-800 border-4 border-black h-10 pl-8 pr-3 font-mono text-sm focus:outline-none"
                                            placeholder="Use the code editor →"
                                            disabled
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Avatar section */}
                    <div className="h-40 border-t-6 border-black relative bg-neutral-900 overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute top-2 left-2 z-20 flex gap-2">
                            <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 border border-black live-badge">LIVE</span>
                            <span className="bg-white text-black text-[9px] font-bold px-1.5 py-0.5 border border-black">
                                {tts.engine === 'elevenlabs' ? 'ELEVEN_LABS' : 'BROWSER_TTS'}
                            </span>
                        </div>
                        {/* Orb in avatar section */}
                        <div className={`w-16 h-16 rounded-full ${orbState === 'speaking' ? 'orb-speaking' : orbState === 'listening' ? 'orb-listening' : orbState === 'thinking' ? 'orb-thinking' : 'orb-idle'}`}
                            style={{ background: orbState === 'speaking' ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : orbState === 'listening' ? 'linear-gradient(135deg, #3b82f6, #14b8a6)' : 'linear-gradient(135deg, #b9f20d, #14b8a6)' }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end justify-center gap-[2px] px-6 pb-2">
                            {(orbState === 'speaking' || orbState === 'listening') && [...Array(8)].map((_, i) => (
                                <div key={i} className="w-1 bg-[--neo-primary] animate-bounce" style={{ height: `${8 + Math.random() * 16}px`, animationDelay: `${i * 0.08}s`, animationDuration: `${0.3 + Math.random() * 0.3}s` }} />
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ─── RIGHT PANEL: Conditional ─── */}
                <section className="hidden md:flex w-[70%] flex-col h-full bg-white dark:bg-card relative">
                    {isCodingQ ? (
                        /* ═══ CODING VIEW ═══ */
                        <>
                            {/* Problem definition (35%) */}
                            <div className="h-[35%] flex flex-col border-b-6 border-black overflow-hidden relative">
                                <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 font-display text-sm z-20">PROBLEM_DEFINITION</div>
                                <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-card blueprint-scroll">
                                    <h2 className="font-display text-2xl mb-4 uppercase">{currentQuestion.topicName}</h2>
                                    <div className="font-mono text-sm leading-relaxed max-w-4xl space-y-4">
                                        <p>
                                            <span className="bg-black text-white px-1 font-bold">OBJECTIVE:</span>{' '}
                                            {currentQuestion.text}
                                        </p>
                                        <p>
                                            <span className="bg-black text-white px-1 font-bold">TYPE:</span>{' '}
                                            {currentQuestion.type} • {currentQuestion.bloomLevel}
                                        </p>
                                        <p>
                                            <span className="bg-black text-white px-1 font-bold">DIFFICULTY:</span>{' '}
                                            {currentQuestion.difficulty.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Code editor (65%) */}
                            <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-900 relative">
                                <div className="h-10 border-b-6 border-black bg-white dark:bg-card flex items-center px-4 justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="font-display text-sm">SOLUTION</span>
                                        <span className="text-xs text-neutral-400 font-bold">READ/WRITE</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-3 h-3 border-2 border-black bg-[--neo-primary]" />
                                        <span className="w-3 h-3 border-2 border-black bg-white dark:bg-card" />
                                        <span className="w-3 h-3 border-2 border-black bg-white dark:bg-card" />
                                    </div>
                                </div>
                                <div className="flex-1 flex overflow-hidden">
                                    {/* Line numbers */}
                                    <div className="w-12 bg-neutral-100 dark:bg-neutral-800 code-line-numbers flex flex-col items-end pt-4">
                                        {Array.from({ length: Math.max(20, codeText.split('\n').length + 5) }, (_, i) => (
                                            <div key={i}>{i + 1}</div>
                                        ))}
                                    </div>
                                    {/* Editor */}
                                    <textarea
                                        className="flex-1 p-4 code-editor bg-white dark:bg-neutral-900 dark:text-white resize-none overflow-y-auto blueprint-scroll"
                                        value={codeText}
                                        onChange={(e) => setCodeText(e.target.value)}
                                        placeholder="// Write your solution here..."
                                        spellCheck={false}
                                    />
                                </div>
                                {/* Bottom bar */}
                                <div className="h-16 border-t-6 border-black bg-white dark:bg-card flex">
                                    <div className="flex-1 flex items-center px-6 border-r-6 border-black bg-neutral-100 dark:bg-neutral-800 justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Status</span>
                                            <span className="font-display text-lg">{phase === 'evaluating' ? 'EVALUATING...' : 'READY'}</span>
                                        </div>
                                        <span className="font-mono text-xs text-neutral-400">Q{session.currentQuestionIndex + 1}/{progress.total}</span>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!codeText.trim() || phase === 'evaluating'}
                                        className="w-[40%] bg-[--neo-primary] hover:bg-black hover:text-[--neo-primary] transition-colors flex items-center justify-center gap-3 relative overflow-hidden disabled:opacity-50 stripe-pattern"
                                    >
                                        <span className="font-display text-2xl tracking-wide relative z-10">[EXECUTE]</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ═══ CONVERSATION VIEW (non-coding) ═══ */
                        <>
                            {/* AI Orb + current state */}
                            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                                <div className="absolute inset-0 bg-blueprint opacity-20 pointer-events-none" />
                                <div className="relative z-10 flex flex-col items-center gap-6 max-w-xl text-center">
                                    <LargeOrb state={orbState} />

                                    {/* Question number */}
                                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                        {session.followUpPending ? 'FOLLOW-UP QUESTION' : `QUESTION ${session.currentQuestionIndex + 1} OF ${progress.total}`}
                                        {' • '}
                                        {currentQuestion.type} • {currentQuestion.topicName}
                                    </div>

                                    {/* Current question text */}
                                    <div className="neo-card p-6 w-full border-6 border-black">
                                        <p className="text-base leading-relaxed">{currentQuestion.text}</p>
                                    </div>

                                    {/* Feedback display */}
                                    {phase === 'showing-feedback' && latestEvaluation && (
                                        <div className="w-full neo-card p-6 border-6 border-black fade-slide-up">
                                            <p className="text-sm leading-relaxed mb-3">{latestEvaluation.conversationalFeedback}</p>
                                            <FeedbackCard evaluation={latestEvaluation} />
                                            <p className="font-mono text-[10px] text-muted-foreground mt-3 animate-pulse">
                                                AUTO-ADVANCING...
                                            </p>
                                        </div>
                                    )}

                                    {/* User's current answer preview */}
                                    {answerText && phase !== 'showing-feedback' && phase !== 'evaluating' && (
                                        <div className="w-full bg-muted border-4 border-black p-4 font-mono text-sm text-left">
                                            <span className="tag-user mb-1 inline-block">YOUR_ANSWER</span>
                                            <p className="mt-1">{answerText}</p>
                                        </div>
                                    )}

                                    {/* Submit button for text answers */}
                                    {answerText.trim() && phase !== 'showing-feedback' && phase !== 'evaluating' && (
                                        <button
                                            onClick={handleSubmit}
                                            className="btn-neo bg-[--neo-primary] px-10 py-3 font-display text-sm uppercase"
                                        >
                                            [SUBMIT ANSWER]
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Bottom status bar */}
                            <div className="h-14 border-t-6 border-black bg-white dark:bg-card flex items-center justify-between px-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 font-mono text-xs">
                                        <span className="text-muted-foreground">PROGRESS:</span>
                                        <span className="font-bold">{progress.current}/{progress.total}</span>
                                    </div>
                                    {latestEvaluation && (
                                        <div className="flex items-center gap-2 font-mono text-xs">
                                            <span className="text-muted-foreground">LAST:</span>
                                            <span className={`font-bold ${scoreColor(latestEvaluation.score)}`}>{latestEvaluation.score}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Voice toggles */}
                                    <button
                                        onClick={tts.toggleEnabled}
                                        className={`font-mono text-[10px] font-bold px-2 py-1 border-2 border-black transition-colors ${tts.enabled ? 'bg-[--neo-violet] text-white' : 'bg-white dark:bg-card'}`}
                                    >
                                        {tts.enabled ? '🔊' : '🔇'}
                                    </button>
                                    <button
                                        onClick={stt.toggleEnabled}
                                        className={`font-mono text-[10px] font-bold px-2 py-1 border-2 border-black transition-colors ${stt.enabled ? 'bg-[--neo-blue] text-white' : 'bg-white dark:bg-card'}`}
                                    >
                                        {stt.enabled ? '🎤' : '🎤'}
                                    </button>
                                    {/* Reset */}
                                    {confirmReset ? (
                                        <div className="flex gap-1">
                                            <button onClick={() => setConfirmReset(false)} className="font-mono text-[10px] font-bold px-2 py-1 border-2 border-black">✕</button>
                                            <button onClick={handleReset} className="font-mono text-[10px] font-bold px-2 py-1 border-2 border-black bg-[--neo-primary]">↻ YES</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmReset(true)} className="font-mono text-[10px] font-bold px-2 py-1 border-2 border-black hover:bg-neutral-100">
                                            ↻ RESET
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    )
}

// ── Typing Text Component ──────────────────────────────────────────
function TypingText({ text }: { text: string }) {
    const { displayed, done } = useTypingAnimation(text, 20)
    return (
        <p className="text-sm leading-relaxed max-w-md mx-auto font-mono">
            {displayed}
            {!done && <span className="animate-pulse">▊</span>}
        </p>
    )
}

// ── Transcript Line (ref-style timestamps) ─────────────────────────
function TranscriptLine({ entry }: { entry: TranscriptEntry }) {
    const isUser = entry.role === 'user'
    const isFeedback = entry.type === 'feedback'
    const isFollowUp = entry.type === 'follow-up'
    const isTransition = entry.type === 'transition'

    return (
        <div className="flex flex-col gap-1 fade-slide-up">
            <TranscriptTag entry={entry} />
            <div className={`border-l-4 pl-3 py-1 text-sm leading-relaxed ${isUser
                ? 'border-black dark:border-white/30'
                : isFeedback
                    ? 'border-[--neo-violet] bg-[--neo-violet]/10'
                    : isFollowUp
                        ? 'border-[--neo-blue] bg-[--neo-blue]/10'
                        : isTransition
                            ? 'border-neutral-300 dark:border-neutral-600 italic text-muted-foreground'
                            : 'border-[--neo-primary] bg-[--neo-primary]/10 font-bold'
                }`}>
                {isFollowUp && (
                    <span className="bg-[--neo-blue] text-white px-1 text-[10px] font-bold mr-2">FOLLOW-UP:</span>
                )}
                {isFeedback && (
                    <span className="bg-[--neo-violet] text-white px-1 text-[10px] font-bold mr-2">EVAL:</span>
                )}
                {entry.text}
                {isFeedback && entry.evaluation && (
                    <FeedbackCard evaluation={entry.evaluation} />
                )}
            </div>
        </div>
    )
}
