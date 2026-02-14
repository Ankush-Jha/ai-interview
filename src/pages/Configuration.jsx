import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { analyzeContent, generateQuestions, detectModes, generateCodingQuestions } from '../lib/gemini'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const personas = [
    { id: 'academic', icon: 'school', color: 'blue', label: 'Academic Professor', desc: 'Strict, detail-oriented, focuses on theoretical knowledge and definitions.' },
    { id: 'hr', icon: 'work', color: 'purple', label: 'HR Recruiter', desc: 'Professional, behavioral focus, asks about soft skills and culture fit.' },
    { id: 'peer', icon: 'sentiment_satisfied_alt', color: 'green', label: 'Friendly Peer', desc: 'Casual tone, collaborative approach, focuses on practical understanding.' },
]

const questionTypes = [
    { id: 'mcq', icon: 'list_alt', label: 'Multiple Choice', desc: 'Quick knowledge checks', defaultOn: false },
    { id: 'open-ended', icon: 'psychology', label: 'Open-Ended Analysis', desc: 'Deep dive explanations', defaultOn: true },
    { id: 'scenario', icon: 'extension', label: 'Scenario-based Problems', desc: 'Real-world application', defaultOn: true },
    { id: 'coding', icon: 'code', label: 'Coding Challenges', desc: 'Write and run code solutions', defaultOn: false },
]

const difficultyLabels = ['easy', 'medium', 'hard']
const difficultyDisplay = ['Easy', 'Medium', 'Hard']
const difficultyInfo = [
    'Questions will be straightforward, focusing on basic recall and fundamental concepts.',
    'Questions will test core concepts with moderate depth, suitable for standard interview preparation.',
    'Advanced questions requiring deep analytical thinking and expert-level understanding.',
]

export default function Configuration() {
    const { state, setSettings, setAnalysis, setQuestions, setLoading, setError, setModeFlags, setJobDescription } = useInterview()
    const navigate = useNavigate()
    useDocumentTitle('Configure Interview', 'Set up your AI interview — choose persona, difficulty, and question types.')

    const [persona, setPersona] = useState('academic')
    const [difficulty, setDifficulty] = useState(1) // 0=Easy, 1=Medium, 2=Hard
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

        const selectedTypes = Object.entries(toggles)
            .filter(([, v]) => v)
            .map(([k]) => k)

        if (selectedTypes.length === 0) {
            setError('Please select at least one question type.')
            return
        }

        const settings = {
            persona,
            difficulty: difficultyLabels[difficulty],
            questionTypes: selectedTypes,
            questionCount,
            codingEnabled: selectedTypes.includes('coding'),
        }
        setSettings(settings)

        // Save JD text to context
        if (jdText.trim()) {
            setJobDescription(jdText.trim())
        }

        setProcessing(true)
        setLoading(true)

        try {
            // Step 1: Analyze content
            setProcessingStep('Analyzing document content...')
            const analysis = await analyzeContent(state.document.text)
            setAnalysis(analysis)

            // Step 1.5: Detect modes if coding enabled
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

            // Step 2: Generate questions
            setProcessingStep('Generating interview questions...')
            const nonCodingTypes = selectedTypes.filter(t => t !== 'coding')
            const codingCount = settings.codingEnabled ? Math.max(1, Math.floor(questionCount * 0.4)) : 0
            const regularCount = questionCount - codingCount

            let allQuestions = []

            // Generate regular questions
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

            // Generate coding questions
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

            // Shuffle to mix coding + non-coding
            allQuestions.sort(() => Math.random() - 0.5)
            // Re-assign IDs
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
        <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {/* Breadcrumb */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Link to="/" className="hover:text-primary">Dashboard</Link>
                    <span className="material-icons-round text-sm">chevron_right</span>
                    <span className="text-primary font-medium">New Session</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Configure Your Interview</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">Upload your PDF source material and customize the AI interviewer's persona to match your preparation goals.</p>
            </div>

            {/* Error Banner */}
            {state.error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <span className="material-icons-round text-red-500">error</span>
                    <span className="text-sm">{state.error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <span className="material-icons-round text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Processing Overlay */}
            {processing && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons-round text-primary text-3xl animate-spin">psychology</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">AI is Preparing Your Interview</h3>
                        <p className="text-slate-500 mb-4">{processingStep}</p>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full animate-pulse" style={{ width: processingStep.includes('Generating') ? '70%' : '35%' }}></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-4">This may take 10-30 seconds</p>
                    </div>
                </div>
            )}

            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 lg:p-8 space-y-10">

                    {/* Section 1: Persona */}
                    <section>
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</span>
                                Interviewer Persona
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 pl-8">Choose who will be conducting your interview session.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                            {personas.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPersona(p.id)}
                                    className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all duration-200 h-full text-center group ${persona === p.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-100 bg-slate-50 hover:border-primary/50 hover:bg-white'
                                        }`}
                                >
                                    <div className={`w-16 h-16 rounded-full bg-${p.color}-100 text-${p.color}-600 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                        <span className="material-icons-round text-3xl">{p.icon}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-1">{p.label}</h3>
                                    <p className="text-xs text-slate-500">{p.desc}</p>
                                    <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${persona === p.id ? 'bg-primary border-primary' : 'border-slate-300 bg-white'
                                        }`}>
                                        {persona === p.id && <span className="material-icons-round text-white text-xs">check</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Section 1.5: Job Description (optional) */}
                    <section>
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="material-icons-round text-primary text-xl">work_outline</span>
                                Job Description
                                <span className="text-xs font-normal text-slate-400 ml-1">(optional)</span>
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 pl-8">Paste a job description to tailor questions to the specific role.</p>
                        </div>
                        <div className="pl-8">
                            <textarea
                                value={jdText}
                                onChange={(e) => setJdText(e.target.value)}
                                placeholder="Paste the job description here to get role-specific questions..."
                                rows={4}
                                maxLength={5000}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none bg-slate-50 placeholder:text-slate-400"
                            />
                            {jdText.length > 4000 && (
                                <p className="text-xs text-amber-500 mt-1">{jdText.length}/5000 characters</p>
                            )}
                            {jdText.trim() && (
                                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                                    <span className="material-icons-round text-xs">check_circle</span>
                                    JD will be used to tailor your interview questions
                                </p>
                            )}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Section 2: Difficulty */}
                        <section>
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</span>
                                    Difficulty Level
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 pl-8">Set the complexity of the questions generated.</p>
                            </div>
                            <div className="pl-8 pt-4 pb-2">
                                <div className="relative mb-6">
                                    <input
                                        type="range" min="0" max="2" step="1" value={difficulty}
                                        onChange={(e) => setDifficulty(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs font-medium text-slate-500 mt-3 px-1">
                                        {difficultyDisplay.map((label, i) => (
                                            <span key={label} className={`cursor-pointer transition-colors ${difficulty === i ? 'text-primary font-bold' : 'hover:text-primary'}`}>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
                                    <span className="material-icons-round text-blue-600 mt-0.5">info</span>
                                    <div>
                                        <p className="text-sm text-blue-900 font-medium">{difficultyDisplay[difficulty]} Difficulty</p>
                                        <p className="text-xs text-blue-700 mt-0.5">{difficultyInfo[difficulty]}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Question Types */}
                        <section>
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">3</span>
                                    Question Types
                                </h2>
                                <p className="text-sm text-slate-500 mt-1 pl-8">Select which formats to include.</p>
                            </div>
                            <div className="pl-8 space-y-4">
                                {questionTypes.map((qt) => (
                                    <div key={qt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="material-icons-round text-slate-400">{qt.icon}</span>
                                            <div>
                                                <span className="block text-sm font-semibold text-slate-900">{qt.label}</span>
                                                <span className="block text-xs text-slate-500">{qt.desc}</span>
                                            </div>
                                        </div>
                                        <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                                            <input
                                                type="checkbox"
                                                checked={toggles[qt.id]}
                                                onChange={() => setToggles(prev => ({ ...prev, [qt.id]: !prev[qt.id] }))}
                                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-primary transition-all duration-300"
                                                id={`toggle-${qt.id}`}
                                            />
                                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" htmlFor={`toggle-${qt.id}`}></label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Question Count */}
                            <div className="pl-8 mt-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Questions</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="3" max="15" step="1" value={questionCount}
                                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-lg font-bold text-primary w-8 text-center">{questionCount}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-5 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span className={`material-icons-round text-lg ${hasDocument ? 'text-primary' : 'text-slate-400'}`}>description</span>
                        <span>
                            {hasDocument ? (
                                <>Currently analyzing: <span className="font-medium text-slate-900">{documentName}</span></>
                            ) : (
                                <span className="text-amber-600 font-medium">No document uploaded — <Link to="/" className="text-primary underline">go back to upload</Link></span>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link to="/" className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors text-center">
                            Cancel
                        </Link>
                        <button
                            onClick={handleStartInterview}
                            disabled={!hasDocument || processing}
                            className={`w-full md:w-auto px-8 py-2.5 rounded-lg text-white shadow-lg font-semibold transition-all flex items-center justify-center gap-2 ${hasDocument && !processing
                                ? 'bg-primary hover:bg-primary-dark shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-slate-300 cursor-not-allowed shadow-none'
                                }`}
                        >
                            <span>{processing ? 'Processing...' : 'Start Interview'}</span>
                            <span className="material-icons-round text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
