import { useState, useCallback, lazy, Suspense } from 'react'
import { runTests } from '../lib/code-runner'

const Editor = lazy(() => import('@monaco-editor/react'))

const LANGUAGES = [
    { id: 'python', label: 'Python (3.10)', icon: 'PY' },
    { id: 'javascript', label: 'JavaScript (Node 18)', icon: 'JS' },
    { id: 'java', label: 'Java (15)', icon: 'JV' },
    { id: 'cpp', label: 'C++ (GCC 10)', icon: 'C+' },
]

export default function CodeEditor({
    question,
    starterCode = '',
    language = 'javascript',
    testCases = [],
    functionName = 'solution',
    hints = [],
    difficulty = 'medium',
    topic = '',
    points = 10,
    onSubmit,
    disabled = false,
}) {
    const [code, setCode] = useState(starterCode)
    const [selectedLang, setSelectedLang] = useState(language)
    const [testResults, setTestResults] = useState(null)
    const [running, setRunning] = useState(false)
    const [activeTab, setActiveTab] = useState('input')
    const [customInput, setCustomInput] = useState('')
    const [consoleOutput, setConsoleOutput] = useState('')
    const [errorOutput, setErrorOutput] = useState('')
    const [showHints, setShowHints] = useState(false)
    const [activeHint, setActiveHint] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [langDropdownOpen, setLangDropdownOpen] = useState(false)

    const handleRun = useCallback(async () => {
        setRunning(true)
        setConsoleOutput('')
        setErrorOutput('')
        setTestResults(null)
        setActiveTab('output')

        try {
            const results = await runTests(code, selectedLang, testCases, functionName)
            setTestResults(results)

            if (results.error) {
                setErrorOutput(results.error)
                setActiveTab('error')
                setConsoleOutput(`❌ Error: ${results.error}`)
            } else {
                const lines = results.results.map((r, i) =>
                    `${r.pass ? '✓' : '✗'} Test ${i + 1}: Input(${r.input}) → Expected(${r.expected}) Got(${r.actual})`
                ).join('\n')
                setConsoleOutput(`${results.passed}/${results.total} test cases passed\n\n${lines}`)
            }
        } catch (err) {
            setErrorOutput(err.message)
            setActiveTab('error')
        } finally {
            setRunning(false)
        }
    }, [code, selectedLang, testCases, functionName])

    const handleSubmit = useCallback(async () => {
        if (!testResults) {
            setRunning(true)
            setActiveTab('output')
            try {
                const results = await runTests(code, selectedLang, testCases, functionName)
                setTestResults(results)
                const lines = results.results.map((r, i) =>
                    `${r.pass ? '✓' : '✗'} Test ${i + 1}: Input(${r.input}) → Expected(${r.expected}) Got(${r.actual})`
                ).join('\n')
                setConsoleOutput(`${results.passed}/${results.total} test cases passed\n\n${lines}`)
                setRunning(false)
                if (onSubmit) {
                    setSubmitting(true)
                    await onSubmit(code, results, selectedLang)
                    setSubmitting(false)
                }
            } catch (err) {
                setErrorOutput(err.message)
                setActiveTab('error')
                setRunning(false)
            }
            return
        }
        if (onSubmit) {
            setSubmitting(true)
            await onSubmit(code, testResults, selectedLang)
            setSubmitting(false)
        }
    }, [code, testResults, selectedLang, testCases, functionName, onSubmit])

    const currentLang = LANGUAGES.find(l => l.id === selectedLang) || LANGUAGES[0]

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-220px)] min-h-[600px] bg-[#1e1e2e] rounded-xl overflow-hidden border border-slate-700 shadow-2xl">

            {/* ── LEFT PANEL: Question ── */}
            <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 bg-[#181825] border-r border-slate-700/50 flex flex-col overflow-hidden">
                {/* Question Header */}
                <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question</span>
                    <div className="flex-1" />
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                        difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                        }`}>{difficulty}</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        ⭐ {points}pts
                    </span>
                </div>

                {/* Question Body (scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                    {/* Title */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 leading-snug">{question}</h2>
                        {topic && (
                            <span className="inline-block mt-2 text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                {topic}
                            </span>
                        )}
                    </div>

                    {/* Constraints */}
                    {testCases.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Constraints</h3>
                            <div className="bg-[#11111b] rounded-lg p-3 text-xs text-slate-400 font-mono space-y-1">
                                <p>1 ≤ test cases ≤ {testCases.length}</p>
                                <p>Time limit: 10 seconds</p>
                            </div>
                        </div>
                    )}

                    {/* Examples */}
                    {testCases.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Examples</h3>
                            <div className="space-y-3">
                                {testCases.slice(0, 2).map((tc, i) => (
                                    <div key={i} className="bg-[#11111b] rounded-lg p-3 border border-slate-700/30">
                                        {tc.description && (
                                            <p className="text-[11px] text-slate-500 mb-2 font-medium">{tc.description}</p>
                                        )}
                                        <div className="space-y-2 text-xs font-mono">
                                            <div>
                                                <span className="text-slate-500">Input</span>
                                                <div className="text-sky-300 bg-sky-500/5 px-2 py-1 rounded mt-0.5">{tc.input}</div>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Output</span>
                                                <div className="text-emerald-300 bg-emerald-500/5 px-2 py-1 rounded mt-0.5">{tc.expected}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hints */}
                    {hints.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowHints(!showHints)}
                                className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <span className="material-icons-round text-sm">
                                    {showHints ? 'visibility_off' : 'lightbulb'}
                                </span>
                                {showHints ? 'Hide Hints' : `Show Hints (${hints.length})`}
                            </button>
                            {showHints && (
                                <div className="mt-2 space-y-2">
                                    {hints.map((hint, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setActiveHint(i)}
                                            className={`text-xs p-2.5 rounded-lg cursor-pointer transition-colors ${i === activeHint
                                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                                : 'bg-[#11111b] text-slate-500 hover:text-slate-400'
                                                }`}
                                        >
                                            💡 Hint {i + 1}: {i <= activeHint ? hint : '(click to reveal)'}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL: Editor + Console ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top Toolbar */}
                <div className="h-10 bg-[#181825] border-b border-slate-700/50 flex items-center px-3 gap-2">
                    {/* Language Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            className="flex items-center gap-2 bg-[#313244] hover:bg-[#45475a] text-slate-200 text-xs font-medium px-3 py-1.5 rounded-md transition-colors border border-slate-600/50"
                        >
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 w-5 h-5 rounded flex items-center justify-center">
                                {currentLang.icon}
                            </span>
                            {currentLang.label}
                            <span className="material-icons-round text-sm text-slate-400">expand_more</span>
                        </button>
                        {langDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 bg-[#313244] border border-slate-600/50 rounded-lg shadow-xl z-50 w-48 py-1">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.id}
                                        onClick={() => { setSelectedLang(lang.id); setLangDropdownOpen(false) }}
                                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#45475a] transition-colors ${selectedLang === lang.id ? 'text-sky-400' : 'text-slate-300'
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 w-5 h-5 rounded flex items-center justify-center">
                                            {lang.icon}
                                        </span>
                                        {lang.label}
                                        {selectedLang === lang.id && (
                                            <span className="material-icons-round text-sm ml-auto">check</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1" />

                    {/* AI Hint */}
                    <button
                        className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-md transition-colors"
                        onClick={() => { setShowHints(true); setActiveHint(Math.min(activeHint + 1, hints.length - 1)) }}
                        title="Get AI hint"
                    >
                        <span className="material-icons-round text-sm">auto_awesome</span>
                        AI
                    </button>

                    {/* Run Button */}
                    <button
                        onClick={handleRun}
                        disabled={running || disabled}
                        className="flex items-center gap-1.5 bg-[#313244] hover:bg-[#45475a] disabled:opacity-40 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors border border-slate-600/50"
                    >
                        <span className="material-icons-round text-sm text-emerald-400">
                            {running ? 'hourglass_empty' : 'play_arrow'}
                        </span>
                        {running ? (selectedLang === 'javascript' ? 'Running...' : 'Running via API...') : 'Run'}
                    </button>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={disabled || submitting}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white text-xs font-bold px-4 py-1.5 rounded-md transition-colors shadow-lg shadow-emerald-900/30"
                    >
                        {submitting ? (
                            <>
                                <span className="material-icons-round text-sm animate-spin">sync</span>
                                Submitting...
                            </>
                        ) : (
                            <>Submit</>
                        )}
                    </button>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 min-h-0">
                    <Suspense fallback={
                        <div className="h-full flex items-center justify-center bg-[#1e1e2e] text-slate-500">
                            <span className="material-icons-round animate-spin mr-2 text-lg">refresh</span>
                            Loading editor...
                        </div>
                    }>
                        <Editor
                            height="100%"
                            language={currentLang.id === 'cpp' ? 'cpp' : currentLang.id}
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val || '')}
                            options={{
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                fontLigatures: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                lineNumbers: 'on',
                                lineNumbersMinChars: 3,
                                roundedSelection: true,
                                padding: { top: 12, bottom: 12 },
                                tabSize: 4,
                                automaticLayout: true,
                                wordWrap: 'on',
                                readOnly: disabled,
                                renderLineHighlight: 'line',
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                smoothScrolling: true,
                                bracketPairColorization: { enabled: true },
                                guides: { bracketPairs: true, indentation: true },
                                suggest: { showKeywords: true, showSnippets: true },
                            }}
                        />
                    </Suspense>
                </div>

                {/* ── Bottom Console Panel ── */}
                <div className="h-[180px] flex-shrink-0 border-t border-slate-700/50 flex flex-col bg-[#181825]">
                    {/* Tab Bar */}
                    <div className="flex items-center border-b border-slate-700/30 px-1">
                        {['input', 'output', 'error'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors relative ${activeTab === tab
                                    ? 'text-slate-200'
                                    : 'text-slate-500 hover:text-slate-400'
                                    }`}
                            >
                                {tab}
                                {tab === 'error' && errorOutput && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
                                )}
                            </button>
                        ))}

                        {testResults && (
                            <div className="ml-auto pr-3 flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${testResults.passed === testResults.total
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : testResults.passed > 0
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {testResults.passed}/{testResults.total} Passed
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-auto p-3">
                        {activeTab === 'input' && (
                            <textarea
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                placeholder="Enter custom input here..."
                                className="w-full h-full bg-transparent text-slate-300 text-xs font-mono resize-none outline-none placeholder:text-slate-600"
                                spellCheck={false}
                            />
                        )}
                        {activeTab === 'output' && (
                            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {consoleOutput || (
                                    <span className="text-slate-600 italic">Click "Run" to execute your code...</span>
                                )}

                                {testResults && testResults.results?.length > 0 && (
                                    <div className="mt-3 space-y-1.5">
                                        {testResults.results.map((r, i) => (
                                            <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-[11px] ${r.pass ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                <span>{r.pass ? '✓' : '✗'}</span>
                                                <span className="text-slate-500">{r.description || `Test ${i + 1}`}</span>
                                                <span className="ml-auto text-slate-600">
                                                    in({r.input}) → {r.pass ? '' : `expected(${r.expected}) got(`}{r.actual}{r.pass ? '' : ')'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </pre>
                        )}
                        {activeTab === 'error' && (
                            <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap">
                                {errorOutput || (
                                    <span className="text-slate-600 italic">No errors</span>
                                )}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
