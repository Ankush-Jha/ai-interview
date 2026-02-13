import { useState } from 'react'
import { Link } from 'react-router-dom'

const progressSteps = [
    { label: 'Introduction', status: 'done', info: 'Completed 10 mins ago' },
    { label: 'React Core Concepts', status: 'done', info: 'Completed 2 mins ago' },
    { label: 'Algorithmic Challenge', status: 'active', info: '' },
    { label: 'System Design', status: 'upcoming', info: 'Upcoming' },
    { label: 'Closing', status: 'upcoming', info: '' },
]

/* ─── Coding Mode Sub-component ─── */
function CodingMode() {
    return (
        <div className="flex-1 flex flex-col bg-[#1e1e1e] rounded-xl shadow-sm border border-slate-700 overflow-hidden relative">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    </div>
                    <div className="h-4 w-px bg-gray-600 mx-2"></div>
                    <span className="text-gray-300 text-sm font-medium">JavaScript</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Autosaved</span>
                    <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                        <span className="material-icons-round text-sm">play_arrow</span>
                        Run Code
                    </button>
                </div>
            </div>

            {/* Code Area */}
            <div className="flex-1 flex font-mono text-sm relative min-h-[300px]">
                <div className="w-12 bg-[#1e1e1e] text-gray-500 flex flex-col items-end pr-3 pt-4 select-none border-r border-[#333] leading-6">
                    {[...Array(13)].map((_, i) => <span key={i}>{i + 1}</span>)}
                </div>
                <div className="flex-1 bg-[#1e1e1e] text-gray-300 p-4 pt-4 overflow-auto leading-6">
                    <pre className="whitespace-pre"><code>
                        {`function flattenArray(arr) {
  // Your implementation here
  let result = [];
  arr.forEach(item => {
    if (Array.isArray(item)) {
      result = result.concat(flattenArray(item));
    } else {
      result.push(item);
    }
  });
  return result;
}
// Test Case
console.log(flattenArray([1, [2, [3, 4], 5], 6]));`}
                    </code></pre>
                </div>
            </div>

            {/* Console */}
            <div className="h-28 border-t border-[#333] bg-[#1e1e1e] flex flex-col">
                <div className="px-4 py-1 bg-[#252526] text-xs text-gray-400 font-medium border-b border-[#333] flex justify-between">
                    <span>Console Output</span>
                    <span className="hover:text-white cursor-pointer">Clear</span>
                </div>
                <div className="p-3 font-mono text-xs text-gray-300 overflow-y-auto">
                    <span className="text-green-400">➜</span> [1, 2, 3, 4, 5, 6]
                    <br />
                    <span className="text-gray-500">Execution time: 12ms</span>
                </div>
            </div>
        </div>
    )
}

/* ─── Voice Mode Sub-component ─── */
function VoiceMode() {
    return (
        <div className="flex-1 relative rounded-2xl bg-gradient-to-b from-transparent to-slate-50 overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            <div className="voice-container w-full h-full absolute inset-0 z-0">
                <div className="wave-layer"></div>
                <div className="wave-layer"></div>
                <div className="wave-layer"></div>
                <div className="wave-layer"></div>
                <div className="core-pulse"></div>
            </div>
            <div className="z-10 flex flex-col items-center gap-8 mt-auto mb-16">
                <div className="text-center space-y-2 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20">
                    <p className="text-lg font-medium text-slate-700">Listening to your answer...</p>
                    <p className="text-sm text-slate-500 animate-pulse">Speak naturally, take your time.</p>
                </div>
                <button className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-xl shadow-red-500/30 mic-button-active z-20 cursor-pointer" title="Stop Recording">
                    <span className="material-icons-round text-4xl">stop</span>
                </button>
            </div>
        </div>
    )
}

/* ─── Main Interview Session ─── */
export default function InterviewSession() {
    const [mode, setMode] = useState('coding') // 'coding' | 'voice'

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-screen overflow-hidden relative">
            {/* Left: Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto relative p-4 md:p-8 lg:pr-4">
                {/* Title Bar */}
                <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Technical Interview: Senior Frontend</h1>
                        <p className="text-slate-500 text-sm mt-1">Session ID: #8823-TX • React & Architecture</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Mode Toggle */}
                        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => setMode('coding')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'coding' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <span className={`material-icons-round text-base ${mode === 'coding' ? 'text-primary' : ''}`}>code</span>
                                Coding Mode
                            </button>
                            <button
                                onClick={() => setMode('voice')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'voice' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <span className={`material-icons-round text-base ${mode === 'voice' ? 'text-primary' : ''}`}>record_voice_over</span>
                                Theoretical
                            </button>
                        </div>
                        {/* Recording Badge */}
                        <div className="hidden md:flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100">
                            <span className="material-icons-round text-sm animate-pulse">fiber_manual_record</span>
                            <span className="text-xs font-semibold tracking-wide uppercase">Recording</span>
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
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Question 3 of 8</span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-400">Algorithmic Challenge</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed">
                                "Implement a function to flatten a deeply nested array. Can you also discuss the time complexity of your solution?"
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Mode Content */}
                <div className="flex-1 flex flex-col gap-4 mb-6 min-h-[400px]">
                    {mode === 'coding' ? <CodingMode /> : <VoiceMode />}
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-between items-center pb-4">
                    <button className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="material-icons-round text-lg">skip_next</span>
                        Skip for now
                    </button>
                    <div className="flex gap-3">
                        {mode === 'coding' ? (
                            <>
                                <button className="px-6 py-3 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                                    Save Draft
                                </button>
                                <Link to="/results" className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                                    <span>Submit Solution</span>
                                    <span className="material-icons-round text-sm">send</span>
                                </Link>
                            </>
                        ) : (
                            <button className="px-6 py-3 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors bg-white">
                                Type Answer Instead
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 p-4 md:p-8 md:pl-0 flex flex-col gap-6">
                {/* Session Progress */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Session Progress</h3>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">35%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '35%' }}></div>
                    </div>
                    <div className="space-y-4">
                        {progressSteps.map((step, i) => (
                            <div key={i} className={`flex items-start gap-3 ${step.status === 'upcoming' ? 'opacity-40' : step.status === 'done' ? 'opacity-50' : ''}`}>
                                {step.status === 'done' ? (
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        <span className="material-icons-round text-sm">check</span>
                                    </div>
                                ) : step.status === 'active' ? (
                                    <div className="w-6 h-6 rounded-full border-2 border-primary bg-gray-50 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 z-10">
                                        {i + 1}
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border border-slate-300 bg-transparent flex items-center justify-center text-slate-400 text-xs font-medium flex-shrink-0">
                                        {i + 1}
                                    </div>
                                )}
                                <div>
                                    <p className={`text-sm ${step.status === 'active' ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{step.label}</p>
                                    {step.status === 'active' && (
                                        <p className="text-xs text-primary font-medium animate-pulse">
                                            {mode === 'coding' ? 'Coding in progress...' : 'Voice mode active...'}
                                        </p>
                                    )}
                                    {step.info && step.status !== 'active' && <p className="text-xs text-slate-500">{step.info}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Feedback */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Live Feedback</h3>
                        <button className="text-primary hover:text-primary-dark">
                            <span className="material-icons-round text-lg">info</span>
                        </button>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-4">
                        <div className="flex gap-2 items-start">
                            <span className="material-icons-round text-primary text-sm mt-0.5">
                                {mode === 'coding' ? 'lightbulb' : 'mic'}
                            </span>
                            <p className="text-sm text-slate-700 leading-snug">
                                {mode === 'coding'
                                    ? 'For nested arrays, remember to handle edge cases like empty arrays or non-array elements. A recursive approach is common.'
                                    : 'Listening for keywords related to recursion, stack depth, and array manipulation methods.'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {mode === 'coding' ? 'Detected Patterns' : 'Speech Analysis'}
                        </h4>
                        {mode === 'coding' ? (
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">Recursion</span>
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">ES6 Syntax</span>
                                <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded border border-green-100">O(n) Complexity</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Clarity</span><span className="text-green-500">Excellent</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full">
                                        <div className="bg-green-500 h-full rounded-full" style={{ width: '90%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Pacing</span><span className="text-primary">Good</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full">
                                        <div className="bg-primary h-full rounded-full" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-500">{mode === 'coding' ? 'Code Quality' : 'Speaking Time'}</span>
                            <span className="text-slate-900 font-medium">{mode === 'coding' ? 'Clean' : '00:42'}</span>
                        </div>
                        {mode === 'coding' && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Syntax Errors</span>
                                <span className="text-slate-900 font-medium">0 Detected</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* End Session */}
                <Link to="/results" className="w-full py-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                    <span className="material-icons-round text-lg">logout</span>
                    End Interview Session
                </Link>
            </aside>
        </div>
    )
}
