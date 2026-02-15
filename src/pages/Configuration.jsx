import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { analyzeContent, generateQuestions, detectModes, generateCodingQuestions } from '../lib/gemini'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const personas = [
    { id: 'academic', icon: 'school', label: 'Academic Professor', desc: 'Strict, detail-oriented, focuses on theoretical knowledge and definitions.', emoji: '🎓' },
    { id: 'hr', icon: 'work', label: 'HR Recruiter', desc: 'Professional, behavioral focus, asks about soft skills and culture fit.', emoji: '💼' },
    { id: 'peer', icon: 'sentiment_satisfied_alt', label: 'Friendly Peer', desc: 'Casual tone, collaborative approach, focuses on practical understanding.', emoji: '🤝' },
]

const questionTypes = [
    { id: 'mcq', icon: 'list_alt', label: 'Multiple Choice', desc: 'Quick knowledge checks', defaultOn: false },
    { id: 'open-ended', icon: 'psychology', label: 'Open-Ended', desc: 'Deep dive explanations', defaultOn: true },
    { id: 'scenario', icon: 'extension', label: 'Scenario-based', desc: 'Real-world application', defaultOn: true },
    { id: 'coding', icon: 'code', label: 'Coding', desc: 'Write and run code', defaultOn: false },
]

const difficultyLevels = [
    { id: 'easy', label: 'Easy', icon: 'spa', color: 'emerald', desc: 'Basic recall and fundamental concepts.' },
    { id: 'medium', label: 'Medium', icon: 'trending_up', color: 'amber', desc: 'Core concepts with moderate depth.' },
    { id: 'hard', label: 'Hard', icon: 'local_fire_department', color: 'red', desc: 'Expert-level analytical thinking.' },
]

export default function Configuration() {
    const { state, setSettings, setAnalysis, setQuestions, setLoading, setError, setModeFlags, setJobDescription } = useInterview()
    const navigate = useNavigate()
    useDocumentTitle('Configure Interview', 'Set up your AI interview — choose persona, difficulty, and question types.')

    const [persona, setPersona] = useState('academic')
    const [difficulty, setDifficulty] = useState(1)
    const [toggles, setToggles] = useState({ mcq: false, 'open-ended': true, scenario: true, coding: false })
    const [questionCount, setQuestionCount] = useState(5)
    const [processing, setProcessing] = useState(false)
    const [processingStep, setProcessingStep] = useState('')
    const [jdText, setJdText] = useState(state.jobDescription || '')

    const documentName = state.document?.metadata?.fileName || state.document?.metadata?.title || 'No document uploaded'
    const hasDocument = !!state.document

    const handleStartInterview = async () => {
        if (!hasDocument) {
            setError('Please upload a PDF first from the Dashboard.')
            return
        }

        const selectedTypes = Object.entries(toggles).filter(([, v]) => v).map(([k]) => k)
        if (selectedTypes.length === 0) {
            setError('Please select at least one question type.')
            return
        }

        const settings = {
            persona,
            difficulty: difficultyLevels[difficulty].id,
            questionTypes: selectedTypes,
            questionCount,
            codingEnabled: selectedTypes.includes('coding'),
        }
        setSettings(settings)

        if (jdText.trim()) setJobDescription(jdText.trim())

        setProcessing(true)
        setLoading(true)

        try {
            setProcessingStep('Analyzing document content...')
            const analysis = await analyzeContent(state.document.text)
            setAnalysis(analysis)

            let modeInfo = null
            if (settings.codingEnabled) {
                setProcessingStep('Detecting coding content...')
                try {
                    modeInfo = await detectModes(state.document.text)
                    setModeFlags(modeInfo)
                } catch (e) {
                    console.warn('Mode detection failed, continuing:', e)
                }
            }

            setProcessingStep('Generating interview questions...')
            const nonCodingTypes = selectedTypes.filter(t => t !== 'coding')
            const codingCount = settings.codingEnabled ? Math.max(1, Math.floor(questionCount * 0.4)) : 0
            const regularCount = questionCount - codingCount

            let allQuestions = []

            if (regularCount > 0 && nonCodingTypes.length > 0) {
                const regular = await generateQuestions(state.document.text, {
                    difficulty: settings.difficulty,
                    count: regularCount,
                    types: nonCodingTypes,
                    persona: settings.persona,
                    jobDescription: jdText.trim() || null,
                })
                const regularArr = Array.isArray(regular) ? regular : regular.questions || []
                allQuestions = regularArr.map(q => ({ ...q, mode: q.mode || 'text' }))
            }

            if (codingCount > 0) {
                setProcessingStep('Generating coding challenges...')
                try {
                    const coding = await generateCodingQuestions(state.document.text, {
                        difficulty: settings.difficulty,
                        count: codingCount,
                        jobDescription: jdText.trim() || null,
                    })
                    const codingArr = Array.isArray(coding) ? coding : coding.questions || []
                    allQuestions = [...allQuestions, ...codingArr.map(q => ({ ...q, mode: 'coding' }))]
                } catch (e) {
                    console.warn('Coding question generation failed:', e)
                }
            }

            allQuestions.sort(() => Math.random() - 0.5)
            allQuestions = allQuestions.map((q, i) => ({ ...q, id: i + 1 }))
            setQuestions(allQuestions)

            setLoading(false)
            setProcessing(false)
            navigate('/session')
        } catch (err) {
            setError('AI processing failed: ' + err.message)
            setProcessing(false)
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full animate-fade-in">
            {/* Breadcrumb */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
                    <span className="material-icons-round text-xs">chevron_right</span>
                    <span className="text-primary font-medium">New Session</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Configure Your Interview</h1>
                <p className="text-slate-500 mt-1 text-sm max-w-xl">Set up your AI interviewer's persona and customize the session to match your preparation goals.</p>
            </div>

            {/* Error Banner */}
            {state.error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3">
                    <span className="material-icons-round text-red-500">error</span>
                    <span className="text-sm flex-1">{state.error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <span className="material-icons-round text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Processing Overlay */}
            {processing && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white rounded-2xl p-10 max-w-md w-full mx-4 shadow-2xl border border-slate-200/80 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons-round text-primary text-3xl animate-spin">psychology</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">AI is Preparing Your Interview</h3>
                        <p className="text-slate-500 mb-6 text-sm">{processingStep}</p>
                        {/* Steps indicator */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            {['Analyze', 'Generate', 'Setup'].map((step, i) => {
                                const isActive = i === 0 ? processingStep.includes('Analyz') : i === 1 ? processingStep.includes('Generat') : false
                                const isDone = i === 0 ? processingStep.includes('Generat') : false
                                return (
                                    <div key={step} className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-primary text-white' :
                                            isActive ? 'bg-primary/20 text-primary' :
                                                'bg-slate-100 text-slate-400'
                                            }`}>
                                            {isDone ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-xs font-medium ${isActive || isDone ? 'text-slate-700' : 'text-slate-400'}`}>{step}</span>
                                        {i < 2 && <div className="w-6 h-px bg-slate-200 mx-1" />}
                                    </div>
                                )
                            })}
                        </div>
                        <p className="text-xs text-slate-400">This may take 10–30 seconds</p>
                    </div>
                </div>
            )}

            {/* Document Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-6 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${hasDocument ? 'bg-primary/10' : 'bg-amber-50'}`}>
                        <span className={`material-icons-round ${hasDocument ? 'text-primary' : 'text-amber-500'}`}>
                            {hasDocument ? 'description' : 'warning'}
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-slate-900">{hasDocument ? documentName : 'No document uploaded'}</p>
                        <p className="text-xs text-slate-400">{hasDocument ? 'Ready for analysis' : 'Go to Dashboard to upload a PDF'}</p>
                    </div>
                </div>
                {!hasDocument && (
                    <Link to="/" className="text-primary text-sm font-semibold hover:underline">Upload PDF →</Link>
                )}
            </div>

            {/* ─── Config Sections ─── */}
            <div className="space-y-6">
                {/* Section 1: Persona */}
                <section className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">1</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-base">Interviewer Persona</h2>
                            <p className="text-xs text-slate-400">Choose who will be conducting your interview.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {personas.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPersona(p.id)}
                                className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 text-center group ${persona === p.id
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-slate-100 hover:border-primary/30 hover:bg-slate-50/50'
                                    }`}
                            >
                                <span className="text-3xl mb-3">{p.emoji}</span>
                                <h3 className="font-bold text-sm text-slate-900 mb-1">{p.label}</h3>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{p.desc}</p>
                                {persona === p.id && (
                                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <span className="material-icons-round text-white text-xs">check</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Section 1.5: Job Description */}
                <section className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <span className="material-icons-round text-blue-500 text-sm">work_outline</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 text-base">Job Description <span className="text-xs font-normal text-slate-400">(optional)</span></h2>
                            <p className="text-xs text-slate-400">Paste a JD to get role-specific questions.</p>
                        </div>
                    </div>
                    <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste the job description here to tailor questions..."
                        rows={3}
                        maxLength={5000}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none bg-slate-50/50 placeholder:text-slate-400"
                    />
                    {jdText.trim() && (
                        <p className="text-xs text-primary mt-2 flex items-center gap-1 font-medium">
                            <span className="material-icons-round text-xs">check_circle</span>
                            JD will be used to tailor your questions
                        </p>
                    )}
                </section>

                {/* Section 2 + 3: Difficulty + Question Types */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Difficulty */}
                    <section className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold text-sm">2</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-base">Difficulty Level</h2>
                                <p className="text-xs text-slate-400">Set complexity of generated questions.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {difficultyLevels.map((lvl, i) => (
                                <button
                                    key={lvl.id}
                                    onClick={() => setDifficulty(i)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${difficulty === i
                                        ? `border-${lvl.color}-300 bg-${lvl.color}-50/50`
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${difficulty === i
                                        ? `bg-${lvl.color}-100 text-${lvl.color}-600`
                                        : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        <span className="material-icons-round">{lvl.icon}</span>
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-semibold text-sm text-slate-800">{lvl.label}</p>
                                        <p className="text-[11px] text-slate-500">{lvl.desc}</p>
                                    </div>
                                    {difficulty === i && (
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <span className="material-icons-round text-white text-xs">check</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Question Types + Count */}
                    <section className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-bold text-sm">3</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-base">Question Types</h2>
                                <p className="text-xs text-slate-400">Select formats to include.</p>
                            </div>
                        </div>
                        <div className="space-y-3 mb-6">
                            {questionTypes.map((qt) => (
                                <button
                                    key={qt.id}
                                    onClick={() => setToggles(prev => ({ ...prev, [qt.id]: !prev[qt.id] }))}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${toggles[qt.id]
                                        ? 'border-primary/30 bg-primary/5'
                                        : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toggles[qt.id] ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            <span className="material-icons-round text-lg">{qt.icon}</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-semibold text-slate-800">{qt.label}</span>
                                            <span className="block text-[11px] text-slate-500">{qt.desc}</span>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${toggles[qt.id] ? 'bg-primary border-primary' : 'border-slate-300'
                                        }`}>
                                        {toggles[qt.id] && <span className="material-icons-round text-white text-xs">check</span>}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Question Count */}
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-slate-700">Number of Questions</label>
                                <span className="text-lg font-bold text-primary">{questionCount}</span>
                            </div>
                            <input
                                type="range" min="3" max="15" step="1" value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
                                <span>3</span>
                                <span>15</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* ─── Footer ─── */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-5">
                <div className="text-sm text-slate-500 flex items-center gap-2">
                    <span className={`material-icons-round text-lg ${hasDocument ? 'text-primary' : 'text-slate-400'}`}>description</span>
                    {hasDocument ? (
                        <>Analyzing: <span className="font-medium text-slate-900">{documentName}</span></>
                    ) : (
                        <span className="text-amber-600 font-medium">No document — <Link to="/" className="text-primary underline">upload one</Link></span>
                    )}
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link to="/" className="w-full md:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors text-center text-sm">
                        Cancel
                    </Link>
                    <button
                        onClick={handleStartInterview}
                        disabled={!hasDocument || processing}
                        className={`w-full md:w-auto px-8 py-2.5 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm ${hasDocument && !processing
                            ? 'bg-primary hover:bg-primary/90 shadow-md shadow-primary/25 hover:shadow-lg'
                            : 'bg-slate-300 cursor-not-allowed'
                            }`}
                    >
                        {processing ? 'Processing...' : 'Start Interview'}
                        <span className="material-icons-round text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
