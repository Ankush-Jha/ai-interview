import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { evaluateAndDecide, getIntro, getTransition, getWrapUp } from '../lib/conversation'
import { useSoundEffects } from '../hooks/useSoundEffects'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import AIOrb from '../components/AIOrb'
import SessionSidebar from '../components/SessionSidebar'
import CodeEditor from '../components/CodeEditor'

// ─── Conversational Interview Session ───
// Continuous-flow conversational interview.
// AI speaks → user responds by voice → AI probes / transitions → next question.
// No "Next Question" button. No visible scores. Feels like a real interviewer.

// Stable waveform bar heights (fix #9 — no Math.random per render)
const WAVEFORM_HEIGHTS = [18, 28, 14, 32, 20, 26, 12, 30, 22, 16, 28, 24, 18, 32, 20, 26]

export default function InterviewSession() {
    useDocumentTitle('Interview Session | AI Interviewer')
    const navigate = useNavigate()
    const { state, dispatch, submitAnswer, setEvaluation, setReport, setLoading, setStatus, addMessage, setAIState, incrementFollowUp, resetFollowUp, nextQuestion } = useInterview()
    const { questions, currentIndex, answers, evaluations, settings, conversationHistory, followUpCount, currentPhase, aiState } = state
    const { playSound } = useSoundEffects()

    // ── Speech hooks ──
    const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis()
    const {
        transcript, interimTranscript, isListening,
        isSupported: micSupported,
        start: startListening, stop: stopListening, reset: resetTranscript, error: micError,
    } = useSpeechRecognition({ continuous: true, interimResults: true })

    // ── Local state ──
    const [phase, setPhase] = useState('intro')    // intro → asking → evaluating → asking (continuous)
    const [startTime] = useState(Date.now())
    const [elapsed, setElapsed] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [showPauseOverlay, setShowPauseOverlay] = useState(false)
    const [useTextMode, setUseTextMode] = useState(false)
    const [textInput, setTextInput] = useState('')
    const [editedTranscript, setEditedTranscript] = useState('')
    const [isEditingTranscript, setIsEditingTranscript] = useState(false)
    const lastSpokenQRef = useRef(-1)
    const chatEndRef = useRef(null)
    const handleSubmitRef = useRef(null)
    const silenceTimerRef = useRef(null)
    const lastTranscriptRef = useRef('')
    const introSpokenRef = useRef(false)

    // ── Derived state ──
    const currentQuestion = questions[currentIndex]
    const isLastQuestion = currentIndex === questions.length - 1
    const progress = questions.length > 0 ? Math.round(((currentIndex) / questions.length) * 100) : 0
    const questionMode = currentQuestion?.mode || 'text'
    const isCodingQuestion = questionMode === 'coding'

    // Dynamic question text — changes for follow-ups, resets on new question
    const [activeQuestionText, setActiveQuestionText] = useState(currentQuestion?.question || '')

    // Reset active question when question index changes
    useEffect(() => {
        if (currentQuestion?.question) setActiveQuestionText(currentQuestion.question)
    }, [currentIndex, currentQuestion?.question])

    // Sync transcript → edited text when not manually editing
    useEffect(() => {
        if (!isEditingTranscript) setEditedTranscript(transcript)
    }, [transcript, isEditingTranscript])

    // Full display transcript
    const fullTranscript = editedTranscript + (interimTranscript ? ` ${interimTranscript}` : '')

    // ── Build visual messages from conversation history ──
    // Fix #7: Simply mirror conversationHistory — no fragile heuristics
    const chatMessages = useMemo(() => {
        return conversationHistory.map((m, i) => ({
            ...m,
            type: m.role === 'ai' ? 'ai' : 'user',
            id: `msg-${i}`,
        }))
    }, [conversationHistory])

    // ── Auto-scroll to bottom ──
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages, fullTranscript, phase])

    // ── Fix #1: Intro greeting on session start ──
    useEffect(() => {
        if (introSpokenRef.current || !questions.length) return
        introSpokenRef.current = true

        const doIntro = async () => {
            setAIState('speaking')
            try {
                const topics = settings?.topics || questions.map(q => q.topic).filter(Boolean)
                const introText = await getIntro(
                    topics,
                    settings?.difficulty || 'medium',
                    questions.length
                )
                addMessage('ai', introText)
                if (ttsSupported) {
                    speak(introText)
                    // Wait for intro speech to finish, then speak Q1
                    const waitForSpeech = () => {
                        const check = setInterval(() => {
                            if (!window.speechSynthesis.speaking) {
                                clearInterval(check)
                                speakCurrentQuestion()
                            }
                        }, 300)
                        // Safety timeout after 15s
                        setTimeout(() => { clearInterval(check); speakCurrentQuestion() }, 15000)
                    }
                    // Small delay for TTS to start
                    setTimeout(waitForSpeech, 500)
                } else {
                    speakCurrentQuestion()
                }
            } catch {
                speakCurrentQuestion()
            }
        }
        doIntro()
    }, [questions.length])

    // ── Speak current question helper ──
    const speakCurrentQuestion = useCallback(() => {
        const q = questions[currentIndex]
        if (!q) return
        addMessage('ai', q.question)
        lastSpokenQRef.current = currentIndex
        setPhase('asking')
        setAIState('idle')
        if (ttsSupported) speak(q.question)
    }, [currentIndex, questions, ttsSupported, speak, addMessage, setAIState])

    // ── Auto-start mic after AI finishes speaking ──
    useEffect(() => {
        if (!isSpeaking && phase === 'asking' && micSupported && !useTextMode && !isCodingQuestion && !isPaused) {
            const timer = setTimeout(() => {
                if (!isListening) {
                    resetTranscript()
                    setEditedTranscript('')
                    setIsEditingTranscript(false)
                    startListening()
                }
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [isSpeaking, phase, micSupported, useTextMode, isCodingQuestion, isPaused])

    // ── Fix #3: Silence detection for auto-submit ──
    useEffect(() => {
        // Only detect silence when actively listening and there's a transcript
        if (!isListening || !editedTranscript.trim() || phase !== 'asking') {
            clearTimeout(silenceTimerRef.current)
            lastTranscriptRef.current = ''
            return
        }

        // If transcript changed, reset the silence timer
        if (editedTranscript !== lastTranscriptRef.current) {
            lastTranscriptRef.current = editedTranscript
            clearTimeout(silenceTimerRef.current)

            silenceTimerRef.current = setTimeout(() => {
                // 3 seconds of silence after speech — auto-submit
                if (editedTranscript.trim() && phase === 'asking' && isListening) {
                    stopListening()
                    doSubmit(editedTranscript.trim())
                }
            }, 3000)
        }

        return () => clearTimeout(silenceTimerRef.current)
    }, [editedTranscript, isListening, phase])

    // ── Timer ──
    useEffect(() => {
        let interval
        if (!isPaused) {
            interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
        }
        return () => clearInterval(interval)
    }, [isPaused, startTime])

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    const getTimerColor = () => {
        if (elapsed > 1800) return 'bg-red-50 text-red-600'
        if (elapsed > 900) return 'bg-amber-50 text-amber-600'
        return 'bg-slate-100 text-slate-600'
    }

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleSubmitRef.current?.() }
            if (e.key === 'Escape') { e.preventDefault(); togglePause() }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // ── Helper: advance to next question with optional transition ──
    const advanceToNextQuestion = useCallback(async () => {
        if (isLastQuestion) {
            // Fix #4: Wrap-up summary before finishing
            setPhase('wrapup')
            setAIState('speaking')
            try {
                const scores = evaluations.filter(Boolean).map(e => e.score || 0)
                const topics = questions.map(q => q.topic).filter(Boolean)
                const wrapUpText = await getWrapUp(scores, topics)
                addMessage('ai', wrapUpText)
                if (ttsSupported) speak(wrapUpText)

                // Wait for wrap-up to finish, then navigate
                const waitAndNav = setInterval(() => {
                    if (!window.speechSynthesis.speaking) {
                        clearInterval(waitAndNav)
                        playSound('complete')
                        setLoading(true)
                        setTimeout(() => navigate('/results'), 1500)
                    }
                }, 300)
                setTimeout(() => { clearInterval(waitAndNav); navigate('/results') }, 20000)
            } catch {
                playSound('complete')
                setLoading(true)
                setTimeout(() => navigate('/results'), 1500)
            }
            return
        }

        // Fix #6: Phase transition between different question types
        const nextQ = questions[currentIndex + 1]
        const currentTopic = currentQuestion?.topic || ''
        const nextTopic = nextQ?.topic || ''
        const topicChanged = currentTopic && nextTopic && currentTopic !== nextTopic

        if (topicChanged) {
            try {
                const transitionText = await getTransition(currentTopic, nextTopic,
                    evaluations.filter(Boolean).map(e => e.score || 0))
                addMessage('ai', transitionText)
                if (ttsSupported) speak(transitionText)
                // Wait for transition speech to finish
                await new Promise(resolve => {
                    const check = setInterval(() => {
                        if (!window.speechSynthesis.speaking) { clearInterval(check); resolve() }
                    }, 300)
                    setTimeout(() => { clearInterval(check); resolve() }, 8000)
                })
            } catch { /* continue without transition */ }
        }

        // Move to next question
        nextQuestion()
        resetFollowUp()
        setTextInput('')
        resetTranscript()
        setEditedTranscript('')
        setIsEditingTranscript(false)

        // Speak the next question (slight delay for state to update)
        setTimeout(() => {
            const nq = questions[currentIndex + 1]
            if (nq) {
                addMessage('ai', nq.question)
                lastSpokenQRef.current = currentIndex + 1
                setPhase('asking')
                setAIState('idle')
                if (ttsSupported) speak(nq.question)
            }
        }, 300)
    }, [isLastQuestion, currentIndex, currentQuestion, questions, evaluations, ttsSupported, speak, navigate])

    // ── Submit answer ──
    const doSubmit = useCallback(async (text) => {
        if (!text?.trim() || phase !== 'asking') return

        clearTimeout(silenceTimerRef.current)
        stopSpeaking()
        stopListening()
        setPhase('evaluating')
        setAIState('thinking')
        playSound('submitted')

        try {
            submitAnswer(currentIndex, text)
            addMessage('user', text)

            const result = await evaluateAndDecide(
                activeQuestionText,
                text,
                conversationHistory,
                state.document?.text,
                followUpCount,
                isLastQuestion
            )

            setEvaluation(currentIndex, result)
            const action = result.action || 'next_question'

            if (action === 'follow_up' && result.followUpQuestion) {
                // ── Follow-up: AI probes deeper ──
                // Fix #8: Separate feedback and follow-up into two messages
                if (result.response) {
                    addMessage('ai', result.response)
                }
                // Brief pause, then ask follow-up
                setTimeout(() => {
                    addMessage('ai', result.followUpQuestion)
                    setActiveQuestionText(result.followUpQuestion)
                    incrementFollowUp()
                    setAIState('idle')
                    setPhase('asking')

                    // Speak: feedback first, then follow-up question
                    if (ttsSupported) {
                        const toSpeak = result.response
                            ? `${result.response} ... ${result.followUpQuestion}`
                            : result.followUpQuestion
                        speak(toSpeak)
                    }
                }, result.response ? 400 : 0)

                // Reset input state
                resetTranscript()
                setEditedTranscript('')
                setIsEditingTranscript(false)
                setTextInput('')

            } else if (action === 'repeat_question' || action === 'off_topic') {
                // ── Repeat / redirect: stay on same question ──
                addMessage('ai', result.response || '')
                setAIState('idle')
                setPhase('asking')

                resetTranscript()
                setEditedTranscript('')
                setIsEditingTranscript(false)
                setTextInput('')

                if (ttsSupported) speak(result.response || '')

            } else {
                // ── Fix #2: Auto-advance — no "Next Question" button ──
                // Speak feedback, then auto-transition to next question
                const feedbackText = result.response || result.feedback || 'Good answer!'
                addMessage('ai', feedbackText)
                setAIState('speaking')

                if (result?.score >= 7) playSound('success')

                if (ttsSupported) {
                    speak(feedbackText)
                    // Wait for feedback to finish speaking, then advance
                    const waitAndAdvance = setInterval(() => {
                        if (!window.speechSynthesis.speaking) {
                            clearInterval(waitAndAdvance)
                            // Brief pause after feedback, then next question
                            setTimeout(() => advanceToNextQuestion(), 800)
                        }
                    }, 300)
                    setTimeout(() => { clearInterval(waitAndAdvance); advanceToNextQuestion() }, 15000)
                } else {
                    // No TTS — auto-advance after 2s reading time
                    setTimeout(() => advanceToNextQuestion(), 2000)
                }
            }
        } catch (err) {
            console.error('Evaluation failed:', err)
            addMessage('ai', 'Hmm, had a hiccup there — let\'s keep going!')
            setAIState('idle')
            // Auto-advance on error too
            setTimeout(() => advanceToNextQuestion(), 1500)
        }
    }, [currentIndex, currentQuestion, activeQuestionText, conversationHistory, followUpCount, isLastQuestion, phase, ttsSupported, speak, advanceToNextQuestion])

    // Submit handlers
    const handleVoiceSubmit = useCallback(() => {
        const text = editedTranscript.trim()
        if (!text) return
        clearTimeout(silenceTimerRef.current)
        stopListening()
        doSubmit(text)
    }, [editedTranscript, doSubmit])

    const handleTextSubmit = useCallback(() => {
        doSubmit(textInput.trim())
        setTextInput('')
    }, [textInput, doSubmit])

    const handleCodeSubmit = useCallback(async (code, testResults, language) => {
        const summary = testResults
            ? `[${language}] ${testResults.passed}/${testResults.total} tests passed\n\n${code}`
            : `[${language}]\n${code}`
        doSubmit(summary)
    }, [doSubmit])

    useEffect(() => { handleSubmitRef.current = useTextMode ? handleTextSubmit : handleVoiceSubmit }, [handleTextSubmit, handleVoiceSubmit, useTextMode])

    // ── Skip ──
    const handleSkip = useCallback(() => {
        clearTimeout(silenceTimerRef.current)
        stopSpeaking()
        stopListening()
        playSound('skip')
        submitAnswer(currentIndex, '(Skipped)')
        setEvaluation(currentIndex, {
            score: 0,
            response: 'Question skipped.',
            feedback: 'Skipped',
            reasoning: 'User skipped this question.',
            strengths: [],
            improvements: [],
        })
        addMessage('user', '(Skipped)')
        addMessage('ai', 'No worries — let\'s move on!')
        if (ttsSupported) speak('No worries — let\'s move on!')

        // Auto-advance after skip message
        setTimeout(() => {
            if (isLastQuestion) {
                advanceToNextQuestion()
            } else {
                nextQuestion()
                resetFollowUp()
                setTextInput('')
                resetTranscript()
                setEditedTranscript('')
                setIsEditingTranscript(false)
                setTimeout(() => {
                    const nq = questions[currentIndex + 1]
                    if (nq) {
                        addMessage('ai', nq.question)
                        lastSpokenQRef.current = currentIndex + 1
                        setPhase('asking')
                        setAIState('idle')
                        if (ttsSupported) speak(nq.question)
                    }
                }, 300)
            }
        }, 1500)
    }, [currentIndex, isLastQuestion, ttsSupported, advanceToNextQuestion])

    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            if (!prev) {
                stopSpeaking()
                stopListening()
                clearTimeout(silenceTimerRef.current)
            }
            setShowPauseOverlay(!prev)
            return !prev
        })
    }, [])

    // ── AI orb state ──
    const orbState = phase === 'evaluating' ? 'thinking' : isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle'

    // ── Silence countdown for UI ──
    const [silenceCountdown, setSilenceCountdown] = useState(0)
    useEffect(() => {
        if (isListening && editedTranscript.trim() && !interimTranscript && phase === 'asking') {
            setSilenceCountdown(3)
            const interval = setInterval(() => {
                setSilenceCountdown(prev => {
                    if (prev <= 1) { clearInterval(interval); return 0 }
                    return prev - 1
                })
            }, 1000)
            return () => { clearInterval(interval); setSilenceCountdown(0) }
        } else {
            setSilenceCountdown(0)
        }
    }, [editedTranscript, interimTranscript, isListening, phase])

    // ── Guard ──
    if (!questions.length || !currentQuestion) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <span className="material-icons-round text-3xl text-slate-300">hourglass_empty</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Loading Questions...</h2>
                    <p className="text-slate-400 text-sm">Preparing your interview session.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-50/50 animate-fade-in">
            {/* ─── Main Conversation Area ─── */}
            <main className={`flex-1 flex flex-col min-w-0 ${isCodingQuestion && phase === 'asking' ? 'lg:w-1/2' : ''}`}>

                {/* ── Top Bar ── */}
                <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200/80">
                    <div className="flex items-center gap-4">
                        <AIOrb state={orbState} size={36} />
                        <div>
                            <h1 className="text-sm font-bold text-slate-900">AI Interview</h1>
                            <p className="text-xs text-slate-400">
                                Q {currentIndex + 1}/{questions.length} · {settings?.difficulty || 'medium'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Progress dots */}
                        <div className="hidden md:flex items-center gap-1.5">
                            {questions.map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-primary scale-125' :
                                    evaluations[i] ? 'bg-emerald-400' : 'bg-slate-200'
                                    }`} />
                            ))}
                        </div>

                        <div className={`px-3 py-1.5 rounded-lg font-mono font-medium text-xs transition-colors flex items-center gap-1.5 ${getTimerColor()}`}>
                            <span className="material-icons-round text-sm">timer</span>
                            {formatTime(elapsed)}
                        </div>

                        <button
                            onClick={togglePause}
                            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                            aria-label={isPaused ? 'Resume' : 'Pause'}
                        >
                            <span className="material-icons-round text-lg">{isPaused ? 'play_arrow' : 'pause'}</span>
                        </button>
                    </div>
                </header>

                {/* ── Chat Thread ── */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
                    {chatMessages.map((msg) => (
                        <ChatBubble key={msg.id} message={msg} />
                    ))}

                    {/* Live typing indicator when evaluating */}
                    {phase === 'evaluating' && (
                        <div className="flex items-start gap-3 chat-bubble-ai">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
                                <span className="material-icons-round text-white text-sm">smart_toy</span>
                            </div>
                            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-200/80 thinking-indicator">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-primary/60 rounded-full thinking-dot" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-primary/60 rounded-full thinking-dot" style={{ animationDelay: '200ms' }} />
                                    <span className="w-2 h-2 bg-primary/60 rounded-full thinking-dot" style={{ animationDelay: '400ms' }} />
                                    <span className="text-xs text-slate-400 ml-1">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Wrap-up phase indicator */}
                    {phase === 'wrapup' && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                <span className="material-icons-round text-white text-sm">auto_awesome</span>
                            </div>
                            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-200/80">
                                <p className="text-sm text-slate-500 italic">Wrapping up your session...</p>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* ── Bottom Input Dock ── */}
                {(phase === 'asking' || phase === 'evaluating') && (
                    <div className="flex-shrink-0 border-t border-slate-200/80 bg-white px-4 md:px-6 py-4">
                        {isCodingQuestion ? (
                            /* Coding mode — minimal message, IDE is next panel */
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <span className="material-icons-round text-violet-500">code</span>
                                    Write your solution in the editor →
                                </p>
                                <button
                                    onClick={handleSkip}
                                    disabled={phase === 'evaluating'}
                                    className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-icons-round text-sm">skip_next</span> Skip
                                </button>
                            </div>
                        ) : useTextMode ? (
                            /* ── Text Mode Fallback ── */
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setUseTextMode(false)}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <span className="material-icons-round text-sm">mic</span>
                                        Switch to voice
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <textarea
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="flex-1 min-h-[52px] max-h-[120px] p-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y transition-all bg-slate-50/50"
                                        disabled={phase === 'evaluating'}
                                        maxLength={5000}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleTextSubmit() }
                                        }}
                                    />
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleTextSubmit}
                                            disabled={!textInput.trim() || phase === 'evaluating'}
                                            className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                                            aria-label="Submit"
                                        >
                                            <span className="material-icons-round">{phase === 'evaluating' ? 'sync' : 'send'}</span>
                                        </button>
                                        <button
                                            onClick={handleSkip}
                                            disabled={phase === 'evaluating'}
                                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                                            aria-label="Skip"
                                        >
                                            <span className="material-icons-round text-lg">skip_next</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ── Voice Input (Default) ── */
                            <div className="space-y-3">
                                {/* Controls Row */}
                                <div className="flex items-center gap-4">
                                    {/* Mic Button */}
                                    <button
                                        onClick={() => {
                                            if (isListening) {
                                                stopListening()
                                                clearTimeout(silenceTimerRef.current)
                                            } else {
                                                resetTranscript()
                                                setEditedTranscript('')
                                                setIsEditingTranscript(false)
                                                startListening()
                                            }
                                        }}
                                        disabled={phase === 'evaluating' || isSpeaking}
                                        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 flex-shrink-0 ${isListening
                                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40 focus:ring-red-300'
                                            : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 focus:ring-primary/30'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        aria-label={isListening ? 'Stop recording' : 'Start recording'}
                                    >
                                        {isListening && (
                                            <>
                                                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                                                <span className="absolute inset-[-3px] rounded-full border-2 border-red-400 animate-pulse opacity-50" />
                                            </>
                                        )}
                                        <span className="material-icons-round text-2xl relative z-10">
                                            {isListening ? 'stop' : 'mic'}
                                        </span>
                                    </button>

                                    {/* Transcript Preview / Waveform */}
                                    <div className="flex-1 min-w-0">
                                        {isListening && !fullTranscript ? (
                                            /* Waveform — Fix #9: stable heights */
                                            <div className="flex items-center gap-1 h-10 px-3">
                                                {WAVEFORM_HEIGHTS.map((h, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-1 bg-red-400 rounded-full animate-pulse"
                                                        style={{
                                                            height: `${h}px`,
                                                            animationDelay: `${i * 0.06}s`,
                                                            animationDuration: `${0.3 + (i % 5) * 0.08}s`,
                                                        }}
                                                    />
                                                ))}
                                                <span className="text-xs text-red-500 ml-2 font-medium">Listening...</span>
                                            </div>
                                        ) : fullTranscript ? (
                                            /* Transcript with silence countdown */
                                            <div className="relative">
                                                <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm text-slate-700 max-h-[80px] overflow-y-auto border border-slate-200/80">
                                                    {fullTranscript}
                                                    {interimTranscript && <span className="text-slate-400 italic"> {interimTranscript}</span>}
                                                </div>
                                                {silenceCountdown > 0 && !interimTranscript && (
                                                    <div className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center">
                                                        <svg className="w-8 h-8 absolute" viewBox="0 0 36 36">
                                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(19, 236, 200, 0.2)" strokeWidth="2" />
                                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#13ecc8" strokeWidth="2.5"
                                                                strokeDasharray="100, 100" className="countdown-ring-circle"
                                                                key={silenceCountdown} />
                                                        </svg>
                                                        <span className="text-xs font-bold text-primary relative z-10">{silenceCountdown}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Placeholder */
                                            <div className="px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2">
                                                <span className="material-icons-round text-lg">mic</span>
                                                {isSpeaking ? 'AI is speaking...' : 'Tap the mic to answer'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <button
                                        onClick={handleVoiceSubmit}
                                        disabled={!editedTranscript.trim() || phase === 'evaluating'}
                                        className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex-shrink-0"
                                        aria-label="Submit answer"
                                    >
                                        <span className="material-icons-round">{phase === 'evaluating' ? 'sync' : 'send'}</span>
                                    </button>
                                </div>

                                {/* Bottom meta row */}
                                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => { setUseTextMode(true); stopListening(); clearTimeout(silenceTimerRef.current) }}
                                            className="hover:text-primary transition-colors flex items-center gap-1"
                                        >
                                            <span className="material-icons-round text-sm">keyboard</span>
                                            Type instead
                                        </button>
                                        {isSpeaking && (
                                            <button onClick={stopSpeaking} className="hover:text-red-500 transition-colors flex items-center gap-1">
                                                <span className="material-icons-round text-sm">volume_off</span>
                                                Stop AI
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {editedTranscript && (
                                            <button
                                                onClick={() => { resetTranscript(); setEditedTranscript(''); setIsEditingTranscript(false); clearTimeout(silenceTimerRef.current) }}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSkip}
                                            disabled={phase === 'evaluating'}
                                            className="hover:text-slate-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <span className="material-icons-round text-sm">skip_next</span>
                                            Skip
                                        </button>
                                    </div>
                                </div>

                                {/* Mic Error */}
                                {micError && (
                                    <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                                        <span className="material-icons-round text-sm">warning</span>
                                        {micError}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ─── Code Editor Panel (coding questions only) ─── */}
            {isCodingQuestion && phase === 'asking' && (
                <div className="w-full lg:w-1/2 border-l border-slate-200/80 bg-slate-900 overflow-hidden">
                    <CodeEditor
                        question={currentQuestion.question}
                        starterCode={currentQuestion.starterCode || ''}
                        language={currentQuestion.language || 'javascript'}
                        testCases={currentQuestion.testCases || []}
                        functionName={currentQuestion.functionName || 'solution'}
                        hints={currentQuestion.hints || []}
                        difficulty={settings?.difficulty || 'medium'}
                        topic={currentQuestion.topic || ''}
                        onSubmit={handleCodeSubmit}
                        disabled={phase === 'evaluating'}
                    />
                </div>
            )}

            {/* ─── Sidebar ─── */}
            <div className="hidden xl:block p-4">
                <SessionSidebar
                    questions={questions}
                    currentIndex={currentIndex}
                    evaluations={evaluations}
                    progress={progress}
                    elapsedTime={elapsed}
                    formatTime={formatTime}
                />
            </div>

            {/* ─── Pause Overlay ─── */}
            {showPauseOverlay && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
                    <div className="text-center p-10 bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md mx-4">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <span className="material-icons-round text-3xl">pause</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Paused</h2>
                        <p className="text-slate-500 mb-6 text-sm">Take a breather. We're ready when you are.</p>
                        <p className="text-sm text-slate-400 mb-8">Time elapsed: {formatTime(elapsed)}</p>
                        <button
                            onClick={togglePause}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
                        >
                            Resume Interview
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}


// ─── Chat Bubble Component ───
function ChatBubble({ message }) {
    const isAI = message.role === 'ai'

    return (
        <div className={`flex items-start gap-3 ${isAI ? 'chat-bubble-ai' : 'flex-row-reverse chat-bubble-user'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAI
                ? 'bg-gradient-to-br from-primary to-violet-500'
                : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                }`}>
                <span className="material-icons-round text-white text-sm">
                    {isAI ? 'smart_toy' : 'person'}
                </span>
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isAI
                ? 'bg-white border border-slate-200/80 text-slate-700 rounded-tl-md'
                : 'bg-primary text-white rounded-tr-md'
                }`}>
                {message.text}
            </div>
        </div>
    )
}
