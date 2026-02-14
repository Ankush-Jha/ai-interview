import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { useAuth } from '../context/AuthContext'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useTypewriter } from '../hooks/useTypewriter'
import { evaluateCode } from '../lib/gemini'
import { saveInterview } from '../lib/firestore'
import { evaluateAndDecide, getIntro, getWrapUp, getSkipResponse } from '../lib/conversation'
import CodeEditor from '../components/CodeEditor'

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
        addMessage, setAIState, incrementFollowUp, resetFollowUp
    } = useInterview()
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
    const [elapsedTime, setElapsedTime] = useState(0)
    const [sessionId] = useState(generateSessionId)
    const [skipMessage, setSkipMessage] = useState(null)
    const [feedback, setFeedback] = useState(null)

    // ─── Refs (avoid stale closures) ───
    const hasStarted = useRef(false)
    const phaseRef = useRef(phase)
    const currentIndexRef = useRef(currentIndex)
    const questionsRef = useRef(questions)
    const evaluationsRef = useRef(evaluations)
    const conversationHistoryRef = useRef(conversationHistory)
    const followUpCountRef = useRef(followUpCount)
    const currentFollowUpRef = useRef(currentFollowUp)
    const settingsRef = useRef(settings)

    // Keep refs in sync
    useEffect(() => { phaseRef.current = phase }, [phase])
    useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
    useEffect(() => { questionsRef.current = questions }, [questions])
    useEffect(() => { evaluationsRef.current = evaluations }, [evaluations])
    useEffect(() => { conversationHistoryRef.current = conversationHistory }, [conversationHistory])
    useEffect(() => { followUpCountRef.current = followUpCount }, [followUpCount])
    useEffect(() => { currentFollowUpRef.current = currentFollowUp }, [currentFollowUp])
    useEffect(() => { settingsRef.current = settings }, [settings])

    // ─── Tools ───
    const speech = useSpeechRecognition()
    const synth = useSpeechSynthesis()
    const { displayed: typedText, done: typingDone } = useTypewriter(aiText, 25)

    const currentQuestion = questions[currentIndex]
    const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0
    const isLastQuestion = currentIndex === questions.length - 1

    // ─── Elapsed Timer ───
    useEffect(() => {
        const timer = setInterval(() => setElapsedTime(t => t + 1), 1000)
        return () => clearInterval(timer)
    }, [])

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
        if (phaseRef.current !== 'asking') return
        const answer = (speech.transcript || inputText || '').trim()
        if (!answer) return

        if (speech.isListening) speech.stop()
        synth.stop()
        setFlowPhase('evaluating')
        setAIState('thinking')
        addMessage('user', answer)
        submitAnswer(currentIndexRef.current, answer)
        setInputText('')

        const idx = currentIndexRef.current
        const activeQ = currentFollowUpRef.current || questionsRef.current[idx]?.question || ''
        const isLast = idx === questionsRef.current.length - 1

        try {
            const result = await evaluateAndDecide(
                activeQ, answer,
                conversationHistoryRef.current, '',
                followUpCountRef.current,
                isLast && !currentFollowUpRef.current
            )

            setEvaluation(idx, {
                score: result.score,
                feedback: result.response,
                strengths: result.strengths || [],
                improvements: result.improvements || [],
                modelAnswer: ''
            })
            setFeedback(result.response)
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
        }
    }, [inputText, speech, synth, addMessage, submitAnswer, setEvaluation, incrementFollowUp,
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
        if (phaseRef.current !== 'asking') return
        synth.stop()
        setFlowPhase('evaluating')
        setAIState('thinking')

        const idx = currentIndexRef.current
        const q = questionsRef.current[idx]

        setCode(idx, code)
        setTestResults(idx, results)
        addMessage('user', `[Code in ${lang}]\n${code}`)
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
        <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-120px)]">

            {/* ═══ LEFT: Main Interview Area ═══ */}
            <div className="flex-1 flex flex-col gap-5 min-w-0">

                {/* Header bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Technical Interview</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Session {sessionId} • {settings?.difficulty || 'medium'} difficulty</p>
                    </div>
                    {currentQuestion.mode === 'coding' || showCodeEditor ? (
                        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button onClick={() => setShowCodeEditor(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${showCodeEditor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                <span className="material-icons-round text-base">code</span> Code
                            </button>
                            <button onClick={() => setShowCodeEditor(false)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!showCodeEditor ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                <span className="material-icons-round text-base">record_voice_over</span> Voice
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl"></div>
                    <div className="flex gap-4 items-start pl-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                            <span className="material-icons-round">smart_toy</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                    Question {currentIndex + 1} of {questions.length}
                                </span>
                                {currentQuestion.topic && (
                                    <>
                                        <span className="text-xs text-slate-300">•</span>
                                        <span className="text-xs text-slate-400">{currentQuestion.topic}</span>
                                    </>
                                )}
                                {currentQuestion.difficulty && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">
                                        {currentQuestion.difficulty}
                                    </span>
                                )}
                            </div>
                            <p className="text-lg font-medium text-slate-800 leading-relaxed">
                                {phase === 'intro' ? typedText : (aiText || currentQuestion.question)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ Answer Area ═══ */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[350px]">

                    {currentQuestion.type === 'mcq' && Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
                        /* ── MCQ Mode ── */
                        <div className="flex-1 flex flex-col p-6">
                            <p className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Select your answer</p>
                            <div className="flex-1 grid grid-cols-1 gap-3">
                                {currentQuestion.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { if (phase === 'asking') { setSelectedOption(opt); setInputText(opt); } }}
                                        disabled={phase !== 'asking'}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${phase !== 'asking' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${selectedOption === opt ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${selectedOption === opt ? 'border-primary bg-primary text-white' : 'border-slate-300 text-slate-400'}`}>
                                                {selectedOption === opt ? '✓' : String.fromCharCode(65 + i)}
                                            </span>
                                            <span className={`text-base ${selectedOption === opt ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>{opt}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-5 flex justify-end">
                                <button
                                    onClick={() => { handleSubmit(); setSelectedOption(null); }}
                                    disabled={phase !== 'asking' || !selectedOption}
                                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${phase === 'asking' && selectedOption ? 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    <span className="material-icons-round text-base">send</span> Submit Answer
                                </button>
                            </div>
                        </div>
                    ) : showCodeEditor ? (
                        <div className="flex-1 p-4">
                            <CodeEditor
                                question={currentQuestion.question}
                                starterCode={currentQuestion.starterCode}
                                language="python"
                                onSubmit={handleCodeSubmit}
                                disabled={phase !== 'asking'}
                            />
                        </div>
                    ) : typingMode ? (
                        /* ── Typing Mode ── */
                        <div className="flex-1 flex flex-col p-5">
                            <textarea
                                className="flex-1 w-full p-4 bg-slate-50 rounded-lg border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-slate-800 placeholder:text-slate-400"
                                placeholder="Type your answer here..."
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                disabled={phase !== 'asking'}
                            />
                            <div className="flex items-center justify-between mt-4">
                                <button
                                    onClick={() => setTypingMode(false)}
                                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
                                >
                                    <span className="material-icons-round text-base">mic</span>
                                    Switch to Voice
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={phase !== 'asking' || !inputText.trim()}
                                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${phase === 'asking' && inputText.trim()
                                        ? 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 hover:shadow-lg'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <span className="material-icons-round text-base">send</span>
                                    Submit Answer
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── Voice Mode ── */
                        <div className="flex-1 flex flex-col items-center justify-center relative p-6">
                            {/* Background orb animation */}
                            <div className="voice-container absolute inset-0 z-0">
                                <div className="wave-layer"></div>
                                <div className="wave-layer"></div>
                                <div className="wave-layer"></div>
                                <div className="core-pulse"></div>
                            </div>

                            {/* Status indicator */}
                            <div className="z-10 text-center mb-6">
                                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 shadow-sm">
                                    <span className={`material-icons-round text-lg ${status.color}`}>{status.icon}</span>
                                    <span className="text-sm font-medium text-slate-700">{status.text}</span>
                                </div>
                            </div>

                            {/* Transcript display */}
                            {(speech.transcript || speech.interimTranscript) && (
                                <div className="z-10 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 p-4 mb-6 max-w-lg w-full shadow-sm">
                                    <p className="text-sm text-slate-400 mb-1 font-medium">Your answer:</p>
                                    <p className="text-slate-700 leading-relaxed">
                                        {speech.transcript}
                                        {speech.interimTranscript && (
                                            <span className="text-slate-400 italic"> {speech.interimTranscript}</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Controls */}
                            <div className="z-10 flex items-center gap-4">
                                {/* Mic button */}
                                <button
                                    onClick={handleMicClick}
                                    disabled={phase !== 'asking'}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${phase !== 'asking'
                                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                        : speech.isListening
                                            ? 'bg-red-500 hover:bg-red-600 mic-button-active shadow-red-500/30 cursor-pointer'
                                            : 'bg-primary hover:bg-primary/90 shadow-primary/30 cursor-pointer'
                                        }`}
                                >
                                    <span className="material-icons-round text-3xl text-white">
                                        {speech.isListening ? 'stop' : 'mic'}
                                    </span>
                                </button>
                                {/* Mic error feedback */}
                                {(micError || speech.error) && (
                                    <p className="text-red-500 text-xs mt-2 text-center max-w-xs">
                                        {micError || speech.error}
                                    </p>
                                )}

                                {/* Submit button — appears after recording */}
                                {speech.transcript && !speech.isListening && phase === 'asking' && (
                                    <button
                                        onClick={handleSubmit}
                                        className="px-5 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                    >
                                        <span className="material-icons-round text-lg">send</span>
                                        Submit Answer
                                    </button>
                                )}
                            </div>

                            {/* Hint to switch to typing */}
                            <button
                                onClick={() => setTypingMode(true)}
                                className="z-10 mt-6 text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
                            >
                                <span className="material-icons-round text-base">keyboard</span>
                                Prefer to type instead?
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom controls bar */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleSkip}
                        disabled={phase !== 'asking'}
                        className={`text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors ${phase === 'asking'
                            ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            : 'text-slate-300 cursor-not-allowed'
                            }`}
                    >
                        <span className="material-icons-round text-lg">skip_next</span>
                        Skip Question
                    </button>
                    <button
                        onClick={handleEndSession}
                        className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors"
                    >
                        <span className="material-icons-round text-lg">logout</span>
                        End Session
                    </button>
                </div>

                {/* Skip toast */}
                {skipMessage && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl z-50 text-sm animate-fade-in-up">
                        {skipMessage}
                    </div>
                )}
            </div>

            {/* ═══ RIGHT: Progress Sidebar ═══ */}
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
        </div>
    )
}
