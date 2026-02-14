import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { useAuth } from '../context/AuthContext'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useTypewriter } from '../hooks/useTypewriter'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useSoundEffects } from '../hooks/useSoundEffects'
import { evaluateCode } from '../lib/gemini'
import { saveInterview } from '../lib/firestore'
import { evaluateAndDecide, getIntro, getWrapUp, getSkipResponse, getDifficultyAdaptation } from '../lib/conversation'
import { normalizeTranscript } from '../utils/prompts'
import CodeEditor from '../components/CodeEditor'
import SessionProgressBar from '../components/SessionProgressBar'
import QuestionCard from '../components/QuestionCard'
import SessionSidebar from '../components/SessionSidebar'

/* ─── Helpers ─── */
function generateSessionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let id = '#'
    for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)]
    id += '-'
    for (let i = 0; i < 2; i++) id += chars[Math.floor(Math.random() * chars.length)]
    return id
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

/* ─── Main Component ─── */
export default function InterviewSession() {
    const {
        state, submitAnswer, setEvaluation, nextQuestion, setCode, setTestResults,
        addMessage, setAIState, incrementFollowUp, resetFollowUp, restoreSession, setSettings
    } = useInterview()
    const { playSound } = useSoundEffects()
    const { user } = useAuth()
    const navigate = useNavigate()
    const { questions, currentIndex, evaluations, settings, conversationHistory, followUpCount, aiState } = state

    // ─── Local State ───
    // Phases: intro | aiSpeaking | asking | evaluating | responding | done
    const [phase, setFlowPhase] = useState('intro')
    const [aiText, setAiText] = useState('')
    const [inputText, setInputText] = useState('')
    const [selectedOption, setSelectedOption] = useState(null)
    const [currentFollowUp, setCurrentFollowUp] = useState(null)
    const [micError, setMicError] = useState(null)
    const [showCodeEditor, setShowCodeEditor] = useState(false)
    const [typingMode, setTypingMode] = useState(false)
    const [browserWarning, setBrowserWarning] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [sessionId] = useState(generateSessionId)
    const [skipMessage, setSkipMessage] = useState(null)
    const [feedback, setFeedback] = useState(null)
    const [coachTip, setCoachTip] = useState(null) // New
    const [resumeData, setResumeData] = useState(null) // Flaw 9: session restore
    const [isPaused, setIsPaused] = useState(false)
    useDocumentTitle('Interview Session', 'Live AI-powered interview session with real-time feedback.')

    // ─── Refs (avoid stale closures) ───
    const hasStarted = useRef(false)
    const isSubmittingRef = useRef(false)
    const phaseRef = useRef(phase)
    const currentIndexRef = useRef(currentIndex)
    const questionsRef = useRef(questions)
    const evaluationsRef = useRef(evaluations)
    const conversationHistoryRef = useRef(conversationHistory)
    const followUpCountRef = useRef(followUpCount)
    const currentFollowUpRef = useRef(currentFollowUp)
    const settingsRef = useRef(settings)
    const inputTextRef = useRef(inputText)

    // Keep refs in sync
    useEffect(() => { phaseRef.current = phase }, [phase])
    useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
    useEffect(() => { questionsRef.current = questions }, [questions])
    useEffect(() => { evaluationsRef.current = evaluations }, [evaluations])
    useEffect(() => { conversationHistoryRef.current = conversationHistory }, [conversationHistory])
    useEffect(() => { followUpCountRef.current = followUpCount }, [followUpCount])
    useEffect(() => { currentFollowUpRef.current = currentFollowUp }, [currentFollowUp])
    useEffect(() => { settingsRef.current = settings }, [settings])
    useEffect(() => { inputTextRef.current = inputText }, [inputText])

    // ─── Tools ───
    const speech = useSpeechRecognition()
    const synth = useSpeechSynthesis()
    const { displayed: typedText, done: typingDone } = useTypewriter(aiText, 25)

    // Flaw 8: Auto-detect unsupported browsers and default to typing mode
    useEffect(() => {
        if (!speech.isSupported) {
            setTypingMode(true)
            setBrowserWarning(true)
        }
    }, [speech.isSupported])

    const currentQuestion = questions[currentIndex]
    const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0
    const isLastQuestion = currentIndex === questions.length - 1

    // ─── Elapsed Timer (pauses when isPaused) ───
    useEffect(() => {
        if (isPaused) return
        const timer = setInterval(() => setElapsedTime(t => t + 1), 1000)
        return () => clearInterval(timer)
    }, [isPaused])

    // ─── Flaw 9: Persist session to sessionStorage ───
    useEffect(() => {
        if (questions.length === 0 || phase === 'done') return
        try {
            sessionStorage.setItem('ai-interview-session', JSON.stringify({
                currentIndex, answers: state.answers, evaluations,
                phase, elapsedTime, inputText,
                savedAt: Date.now(), // session expiry timestamp
            }))
        } catch { /* quota exceeded — silently ignore */ }
    }, [currentIndex, state.answers, evaluations, phase, elapsedTime, inputText, questions.length])


    // ─── Flaw 9: Check for saved session on mount ───
    const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000 // 2 hours
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('ai-interview-session')
            if (saved && questions.length > 0) {
                const parsed = JSON.parse(saved)
                // Check session expiry
                if (parsed.savedAt && Date.now() - parsed.savedAt > SESSION_EXPIRY_MS) {
                    sessionStorage.removeItem('ai-interview-session')
                    return // expired session — start fresh
                }
                if (parsed.currentIndex > 0) {
                    setResumeData(parsed)
                }
            }
        } catch { /* corrupt data — ignore */ }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Guard: no questions → redirect ───
    useEffect(() => { if (questions.length === 0) navigate('/configure') }, [questions, navigate])

    // ─── Sync AI state with speech ───
    useEffect(() => {
        if (synth.isSpeaking) setAIState('speaking')
        else if (aiState === 'speaking') setAIState('idle')
    }, [synth.isSpeaking])

    // ─── Speak + wait helper ───
    const speakAndWait = useCallback((text) => {
        return new Promise((resolve) => {
            if (!text) { resolve(); return }
            synth.stop()
            synth.speak(text)

            const check = setInterval(() => {
                if (!window.speechSynthesis.speaking) {
                    clearInterval(check)
                    setTimeout(resolve, 400)
                }
            }, 200)

            // Safety timeout: max 60s
            setTimeout(() => { clearInterval(check); resolve() }, 60000)
        })
    }, [synth])

    // ─── Deliver Question ───
    const deliverQuestion = useCallback(async (index) => {
        const q = questionsRef.current[index]
        if (!q) return

        speech.reset()
        setSkipMessage(null)
        setInputText('')
        setFeedback(null)
        setMicError(null)

        if (q.mode === 'coding') {
            const msg = "Time for a coding challenge."
            setAiText(msg)
            setAIState('speaking')
            setShowCodeEditor(true)
            setFlowPhase('aiSpeaking')
            await speakAndWait(msg)
            setFlowPhase('asking')
            setAIState('idle')
            return
        }

        setShowCodeEditor(false)
        addMessage('ai', q.question)
        setAiText(q.question)
        setAIState('speaking')
        setFlowPhase('aiSpeaking')
        setCurrentFollowUp(null)

        // Speak the question, then enable mic
        await speakAndWait(q.question)
        setFlowPhase('asking')
        setAIState('idle')
    }, [speech, synth, addMessage, setAIState, speakAndWait])

    // ─── Start Session (handles full intro → first question) ───
    useEffect(() => {
        if (hasStarted.current || questions.length === 0) return
        hasStarted.current = true

        const runIntro = async () => {
            try {
                setAIState('thinking')
                const topics = questions.map(q => q.topic).filter(Boolean)
                const intro = await getIntro(topics, settings?.difficulty, questions.length)
                addMessage('ai', intro)
                setAiText(intro)
                setAIState('speaking')
                setFlowPhase('intro')

                // Speak intro and wait for it to finish
                await speakAndWait(intro)

                // Brief pause after intro before first question
                await new Promise(r => setTimeout(r, 1500))

                // Deliver first question directly
                deliverQuestion(0)
            } catch (err) {
                console.error('Intro failed:', err)
                // Fallback: skip intro and go directly to first question
                deliverQuestion(0)
            }
        }

        runIntro()
    }, [questions])

    // ─── Save & End Session ───
    const saveAndEnd = useCallback(async () => {
        synth.stop()
        if (speech.isListening) speech.stop()
        sessionStorage.removeItem('ai-interview-session')

        const evals = evaluationsRef.current
        const qs = questionsRef.current
        const s = settingsRef.current

        const validEvals = evals.filter(Boolean)
        const scores = validEvals.map(e => e?.score || 0)
        const avgScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10)
            : 0

        try {
            if (user?.uid) {
                await saveInterview(user.uid, {
                    documentName: state.document?.metadata?.fileName || 'Interview',
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    score: Math.min(avgScore, 100),
                    questionCount: qs.length,
                    difficulty: s?.difficulty || 'medium',
                    persona: s?.persona || 'academic',
                })
            }
        } catch (err) {
            console.error('Failed to save interview:', err)
        }

        navigate('/results')
    }, [user, state.document, synth, speech, navigate])

    // ─── Handle Submit ───
    const handleSubmit = useCallback(async () => {
        if (phaseRef.current !== 'asking' || isSubmittingRef.current) return
        const rawAnswer = (speech.transcript || inputTextRef.current || '').trim()
        if (!rawAnswer) return
        // Normalize STT artifacts for voice answers; typed answers pass through
        const answerText = speech.transcript ? normalizeTranscript(rawAnswer) : rawAnswer
        isSubmittingRef.current = true

        if (speech.isListening) speech.stop()
        synth.stop()
        setFlowPhase('evaluating')
        setAIState('thinking')
        setAIState('thinking')
        addMessage('user', answerText)
        playSound('submit')
        submitAnswer(currentIndexRef.current, answerText)
        setInputText('')

        const idx = currentIndexRef.current
        const q = questionsRef.current[idx]
        const activeQ = currentFollowUpRef.current || q?.question || ''
        const isLast = idx === questionsRef.current.length - 1
        const followUpCount = followUpCountRef.current

        try {
            const result = await evaluateAndDecide(
                q.question,
                answerText,
                conversationHistoryRef.current,
                q.topic,
                followUpCount,
                isLast && !currentFollowUpRef.current,
                state.settings.difficulty
            )

            setEvaluation(idx, {
                score: result.score,
                feedback: result.response,
                strengths: result.strengths || [],
                improvements: result.improvements || [],
                modelAnswer: '',
                tip: result.tip // Store tip
            })
            setFeedback(result.response)
            if (result.tip) {
                setCoachTip(result.tip)
                setTimeout(() => setCoachTip(null), 12000)
            }
            setFlowPhase('responding')

            if (result.action === 'repeat_question' || result.action === 'off_topic') {
                // Don't score or advance — just speak the AI response and re-ask
                addMessage('ai', result.response)
                setAiText(result.response)
                setAIState('speaking')
                setFlowPhase('responding')
                await speakAndWait(result.response)
                await new Promise(r => setTimeout(r, 1500))
                setFlowPhase('asking')
                speech.reset()
            } else if (result.action === 'follow_up' && result.followUpQuestion) {
                incrementFollowUp()
                const txt = `${result.response}\n\n${result.followUpQuestion}`
                addMessage('ai', txt)
                setAiText(txt)
                setCurrentFollowUp(result.followUpQuestion)
                setAIState('speaking')
                await speakAndWait(txt)
                // 2-second grace period before allowing next answer
                await new Promise(r => setTimeout(r, 2000))
                setFlowPhase('asking')
            } else {
                addMessage('ai', result.response)
                setAiText(result.response)
                setAIState('speaking')
                resetFollowUp()
                setCurrentFollowUp(null)

                if (!isLast) {
                    await speakAndWait(result.response)
                    // 3-second grace period before next question
                    await new Promise(r => setTimeout(r, 3000))
                    nextQuestion()
                    deliverQuestion(idx + 1)

                    // Adaptive Difficulty Check (every 3 questions)
                    if (idx > 0 && (idx + 1) % 3 === 0) {
                        try {
                            const adaptation = await getDifficultyAdaptation(conversationHistoryRef.current, state.settings.difficulty)
                            if (adaptation.action !== 'maintain' && adaptation.newDifficulty !== state.settings.difficulty) {
                                setSettings({ difficulty: adaptation.newDifficulty })
                                const msg = `(Adjusting difficulty to ${adaptation.newDifficulty} based on your progress)`
                                addMessage('ai', msg)
                            }
                        } catch (err) {
                            console.warn('Difficulty adaptation failed', err)
                        }
                    }
                } else {
                    await speakAndWait(result.response)
                    setAIState('thinking')
                    const realScores = evaluationsRef.current.filter(Boolean).map(e => e?.score || 0)
                    const topics = questionsRef.current.map(q => q.topic).filter(Boolean)
                    const wrapUp = await getWrapUp(realScores, topics)
                    setAiText(wrapUp)
                    setFlowPhase('done')
                    await speakAndWait(wrapUp)
                    await saveAndEnd()
                }
            }
        } catch (err) {
            console.error('Interview evaluation failed:', err)
            setAiText("I had a brief hiccup processing that. Let's keep going!")
            setFlowPhase('asking')
            setAIState('idle')
            synth.speak("I had a brief hiccup processing that. Let's keep going!")
        } finally {
            isSubmittingRef.current = false
        }
    }, [speech, synth, addMessage, submitAnswer, setEvaluation, incrementFollowUp,
        resetFollowUp, nextQuestion, deliverQuestion, speakAndWait, saveAndEnd, setAIState])

    // ─── Handle Skip ───
    const handleSkip = useCallback(() => {
        synth.stop()
        if (speech.isListening) speech.stop()
        speech.reset()

        const idx = currentIndexRef.current
        const isLast = idx === questionsRef.current.length - 1
        const msg = getSkipResponse()
        setSkipMessage(msg)
        setAiText(msg)
        playSound('skip')
        submitAnswer(idx, '(skipped)')
        setEvaluation(idx, { score: 0, feedback: 'Question skipped', strengths: [], improvements: [], modelAnswer: '' })

        if (!isLast) {
            synth.speak(msg)
            setTimeout(() => {
                nextQuestion()
                deliverQuestion(idx + 1)
                setSkipMessage(null)
            }, 2000)
        } else {
            ; (async () => {
                await speakAndWait(msg)
                setAIState('thinking')
                const realScores = evaluationsRef.current.filter(Boolean).map(e => e?.score || 0)
                const topics = questionsRef.current.map(q => q.topic).filter(Boolean)
                const wrapUp = await getWrapUp(realScores, topics)
                setAiText(wrapUp)
                setFlowPhase('done')
                await speakAndWait(wrapUp)
                await saveAndEnd()
            })()
        }
    }, [synth, speech, submitAnswer, setEvaluation, nextQuestion, deliverQuestion, speakAndWait, saveAndEnd, setAIState])

    // ─── Handle Code Submit ───
    const handleCodeSubmit = useCallback(async (code, results, lang) => {
        if (phaseRef.current !== 'asking' || isSubmittingRef.current) return
        isSubmittingRef.current = true
        synth.stop()
        setFlowPhase('evaluating')
        setAIState('thinking')

        const idx = currentIndexRef.current
        const q = questionsRef.current[idx]

        setCode(idx, code)
        setTestResults(idx, results)
        addMessage('user', `[Code in ${lang}]\n${code}`)
        playSound('submit')
        submitAnswer(idx, code)

        try {
            const evalResult = await evaluateCode(q.question, code, results, lang)
            setEvaluation(idx, {
                score: evalResult?.score ?? 5,
                feedback: evalResult?.response || evalResult?.feedback || 'Code evaluated.',
                strengths: evalResult?.strengths || [],
                improvements: evalResult?.improvements || [],
                modelAnswer: evalResult?.modelAnswer || ''
            })

            const responseText = evalResult?.response || evalResult?.feedback || 'Thanks for that solution!'
            addMessage('ai', responseText)
            setAiText(responseText)
            setFlowPhase('responding')
            setAIState('speaking')
            await speakAndWait(responseText)

            const isLast = idx === questionsRef.current.length - 1
            if (!isLast) {
                await new Promise(r => setTimeout(r, 2000))
                nextQuestion()
                deliverQuestion(idx + 1)
            } else {
                await saveAndEnd()
            }
        } catch (err) {
            console.error('Code evaluation failed:', err)
            setAiText("I couldn't evaluate that code, but let's move on!")
            setFlowPhase('asking')
            setAIState('idle')
        } finally {
            isSubmittingRef.current = false
        }
    }, [synth, setCode, setTestResults, addMessage, submitAnswer, setEvaluation,
        speakAndWait, nextQuestion, deliverQuestion, saveAndEnd, setAIState])

    // ─── End Interview ───
    const handleEndSession = useCallback(async () => {
        if (window.confirm('End this interview? Your progress will be saved.')) {
            setAIState('thinking')
            setFlowPhase('done')
            try {
                const realScores = evaluationsRef.current.filter(Boolean).map(e => e?.score || 0)
                const topics = questionsRef.current.map(q => q.topic).filter(Boolean)
                const wrapUp = await getWrapUp(realScores, topics)
                setAiText(wrapUp)
                await speakAndWait(wrapUp)
            } catch { /* skip wrap-up on error */ }
            await saveAndEnd()
        }
    }, [speakAndWait, saveAndEnd, setAIState])

    // ─── Keyboard Shortcuts ───
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+Enter — submit answer
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
            }
            // Ctrl+M — toggle mic
            if (e.ctrlKey && e.key === 'm') {
                e.preventDefault()
                handleMicClick()
            }
            // Ctrl+S — skip question (prevent browser save)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault()
                handleSkip()
            }
            // Escape — stop mic / cancel speech
            if (e.key === 'Escape') {
                if (speech.isListening) speech.stop()
                synth.stop()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleSubmit, handleSkip, handleMicClick, speech, synth])

    // ─── Render Guard ───
    if (!currentQuestion) return null

    // ─── Status Text with clear user guidance ───
    // ─── Mic Click Handler — stops synthesis first, then starts recognition ───
    const handleMicClick = useCallback(() => {
        setMicError(null)
        if (speech.isListening) {
            speech.stop()
            return
        }
        // Stop any remaining synthesis before starting mic
        synth.stop()
        window.speechSynthesis.cancel()
        // Small delay to let synthesis fully stop before starting recognition
        setTimeout(() => {
            try {
                speech.start()
            } catch (err) {
                setMicError('Could not start microphone. Please check browser permissions.')
                console.error('Mic start error:', err)
            }
        }, 200)
    }, [speech, synth])

    const getStatusInfo = () => {
        if (phase === 'evaluating') return { icon: 'psychology', text: 'Analyzing your answer...', color: 'text-amber-500' }
        if (phase === 'responding') return { icon: 'record_voice_over', text: 'AI is responding...', color: 'text-blue-500' }
        if (phase === 'done') return { icon: 'check_circle', text: 'Interview complete!', color: 'text-green-500' }
        if (phase === 'intro') return { icon: 'waving_hand', text: 'The interviewer is introducing the session...', color: 'text-primary' }
        if (phase === 'aiSpeaking') return { icon: 'record_voice_over', text: 'Listen to the question...', color: 'text-blue-500' }
        if (speech.isListening) return { icon: 'mic', text: 'Listening... Click the red button when done, then submit', color: 'text-red-500' }
        if (phase === 'asking') return { icon: 'mic_none', text: '🎤 Your turn! Click the mic to start answering', color: 'text-green-600' }
        return { icon: 'hourglass_empty', text: 'Please wait...', color: 'text-slate-500' }
    }
    const status = getStatusInfo()

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-80px)]">

            {/* Mobile Header: Progress & Timer */}
            <div className="lg:hidden w-full space-y-3 mb-2">
                <SessionProgressBar questions={questions} currentIndex={currentIndex} phase={phase} />
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2 text-sm font-mono font-medium text-slate-500">
                        <span className="material-icons-round text-base">timer</span>
                        {formatTime(elapsedTime)}
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold uppercase rounded-md tracking-wider">
                        {state.settings.difficulty}
                    </span>
                </div>
            </div>

            {/* Resume Session Dialog */}
            {resumeData && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 lg:p-8 max-w-md w-full shadow-2xl text-center">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                            <span className="material-icons-round text-primary text-2xl">restore</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Previous Session?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            You were on question {resumeData.currentIndex + 1} of {questions.length}.
                            Would you like to pick up where you left off?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => {
                                    restoreSession({
                                        currentIndex: resumeData.currentIndex,
                                        evaluations: resumeData.evaluations,
                                    })
                                    setElapsedTime(resumeData.elapsedTime || 0)
                                    setFlowPhase('asking')
                                    setResumeData(null)
                                }}
                                className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                            >
                                Resume
                            </button>
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('ai-interview-session')
                                    setResumeData(null)
                                }}
                                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-all"
                            >
                                Start New
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pause Overlay */}
            {isPaused && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
                        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <span className="material-icons-round text-amber-500 text-2xl">pause_circle_filled</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Interview Paused</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Take your time. Timer is paused. Your progress is saved.
                        </p>
                        <button
                            onClick={() => setIsPaused(false)}
                            className="px-8 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                        >
                            <span className="flex items-center gap-2">
                                <span className="material-icons-round text-base">play_arrow</span>
                                Resume Interview
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-4 lg:gap-6 relative min-w-0">

                {/* Desktop Header */}
                <div className="hidden lg:flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Technical Interview</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Session {sessionId} • {state.settings.difficulty} difficulty</p>
                    </div>
                    {phase !== 'done' && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold transition-all ${elapsedTime >= 1800
                            ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                            : elapsedTime >= 1200
                                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                : 'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}>
                            <span className="material-icons-round text-base">timer</span>
                            {formatTime(elapsedTime)}
                        </div>
                    )}
                </div>

                {/* Question Display */}
                <QuestionCard
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                    question={questions[currentIndex]}
                    phase={phase}
                    typedText={aiText}
                    aiText={aiText}
                />

                {/* Mobile Feedback Display */}
                {feedback && (
                    <div className="lg:hidden bg-primary/5 border border-primary/10 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <h4 className="flex items-center gap-2 font-semibold text-primary text-sm mb-2">
                            <span className="material-icons-round text-base">feedback</span>
                            Feedback
                        </h4>
                        <p className="text-slate-700 text-sm leading-relaxed">{feedback}</p>
                    </div>
                )}

                {/* Interaction Area */}
                {phase === 'done' ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in slide-in-from-bottom-5">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons-round text-green-600 text-3xl">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Complete!</h2>
                        <p className="text-slate-500 mb-6">Great job completing the session. Let's see how you did.</p>
                        <button
                            onClick={handleFinish}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center gap-2 mx-auto"
                        >
                            View Results
                            <span className="material-icons-round">arrow_forward</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px] relative">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)',
                                backgroundSize: '24px 24px'
                            }}></div>

                        {/* Coding Environment */}
                        {showCodeEditor && (
                            <div className="absolute inset-0 bg-white z-20 flex flex-col">
                                <CodeEditor
                                    language="javascript" // TODO: Detect lang
                                    code={state.codeSubmissions[currentIndex]}
                                    onChange={(val) => setCode(currentIndex, val)}
                                    onSubmit={handleCodeSubmit}
                                    isSubmitting={isSubmittingRef.current}
                                    testCases={questions[currentIndex].testCases}
                                />
                                <button
                                    onClick={() => setShowCodeEditor(false)}
                                    className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-lg text-slate-500 hover:text-slate-700 z-30"
                                >
                                    <span className="material-icons-round">close</span>
                                </button>
                            </div>
                        )}

                        {/* Center Stage: Mic & Status */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6 lg:p-12 relative z-10">
                            {/* Status Indicator */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-slate-100 transition-all duration-300">
                                <span className={`material-icons-round ${status.color} animate-pulse`}>{status.icon}</span>
                                <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                            </div>

                            {/* Main Mic Button */}
                            <div className="relative group">
                                {(speech.isListening || aiState === 'thinking') && (
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping duration-1000"></div>
                                )}
                                <button
                                    onClick={toggleMic}
                                    disabled={phase === 'done' || aiState === 'thinking' || isSubmittingRef.current}
                                    className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${speech.isListening
                                        ? 'bg-red-500 text-white shadow-red-500/30'
                                        : aiState === 'thinking'
                                            ? 'bg-amber-400 text-white shadow-amber-400/30 cursor-wait'
                                            : phase === 'intro' || phase === 'aiSpeaking'
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-primary text-white shadow-primary/30'
                                        }`}
                                >
                                    <span className="material-icons-round text-4xl lg:text-5xl">
                                        {speech.isListening ? 'mic_off' : aiState === 'thinking' ? 'psychology' : 'mic'}
                                    </span>
                                </button>

                                {/* Helper Text */}
                                {!speech.isListening && phase === 'asking' && (
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to speak
                                    </div>
                                )}
                            </div>

                            {/* Text Input Fallback */}
                            <div className="w-full max-w-2xl relative">
                                <div className="relative group">
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSubmit()
                                            }
                                        }}
                                        placeholder={phase === 'asking' ? "Or type your answer here..." : "Wait for the interviewer..."}
                                        disabled={phase !== 'asking' || aiState === 'thinking'}
                                        className="w-full pl-6 pr-14 py-4 bg-white border border-slate-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-sm disabled:bg-slate-50 disabled:text-slate-400 text-base"
                                        rows={1}
                                        style={{ minHeight: '3.5rem' }}
                                    />
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!inputText.trim() || phase !== 'asking'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors disabled:text-slate-300"
                                    >
                                        <span className="material-icons-round">send</span>
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mt-3 px-2">
                                    <button
                                        onClick={() => setShowCodeEditor(true)}
                                        className="text-slate-400 hover:text-primary text-sm font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <span className="material-icons-round text-base">code</span>
                                        Open Code Editor
                                    </button>
                                    {phase === 'asking' && (
                                        <button
                                            onClick={handleSkip}
                                            className="text-slate-400 hover:text-slate-600 text-sm font-medium hover:underline transition-all"
                                        >
                                            Skip this question
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <SessionSidebar
                    questions={questions}
                    currentIndex={currentIndex}
                    evaluations={evaluations}
                    progress={Math.round(((currentIndex + (phase === 'done' ? 1 : 0)) / questions.length) * 100)}
                    feedback={feedback}
                    elapsedTime={elapsedTime}
                    formatTime={formatTime}
                />
            </div>

            {/* Coaching Tip Toast */}
            {coachTip && (
                <div className="fixed bottom-24 right-6 bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-lg max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500 z-50">
                    <div className="flex items-start gap-3">
                        <span className="material-icons-round text-amber-500">lightbulb</span>
                        <div className="flex-1">
                            <h4 className="font-semibold text-amber-800 text-sm">Quick Tip</h4>
                            <p className="text-amber-700 text-sm mt-1">{coachTip}</p>
                        </div>
                        <button onClick={() => setCoachTip(null)} className="text-amber-400 hover:text-amber-600">
                            <span className="material-icons-round text-sm">close</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
