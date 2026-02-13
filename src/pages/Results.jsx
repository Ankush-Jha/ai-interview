import { Link } from 'react-router-dom'

const strengths = [
    'Excellent grasp of React Hooks and custom hook implementation strategies.',
    'Demonstrated strong knowledge of state management (Redux/Context API).',
    'Clear articulation of component lifecycle and optimization patterns.',
]

const improvements = [
    'Could elaborate more on Error Boundary implementation in functional components.',
    'Testing methodology discussion was brief; missed mention of integration tests.',
    'Response time on system design question was slightly prolonged.',
]

const metrics = [
    { label: 'Technical Depth', score: 92, color: 'blue', icon: 'code' },
    { label: 'Communication', score: 85, color: 'purple', icon: 'record_voice_over' },
    { label: 'Problem Solving', score: 78, color: 'teal', icon: 'psychology_alt' },
]

export default function Results() {
    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <span className="material-icons-round text-base">description</span>
                        <span>Resume_Senior_Dev.pdf</span>
                        <span className="mx-1">•</span>
                        <span>Feb 14, 2026</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Interview Results Analysis</h1>
                    <p className="text-slate-500 mt-1">Candidate: <span className="font-semibold text-slate-700">Ankit Jakhar</span> — Senior React Developer Role</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                        <span className="material-icons-round text-base">download</span>
                        Export PDF
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                        <span className="material-icons-round text-base">share</span>
                        Share
                    </button>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Overall Score */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-6 h-full border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="material-icons-round text-primary">analytics</span>
                            Overall Performance
                        </h2>
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="relative w-56 h-56">
                                <svg className="circular-chart text-primary" viewBox="0 0 36 36">
                                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeDasharray="87, 100" />
                                    <text className="percentage" x="18" y="19" fill="#1E293B">87</text>
                                    <text className="percentage-label" x="18" y="23.5">TOTAL SCORE</text>
                                </svg>
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10 scale-75 animate-pulse"></div>
                            </div>
                            <div className="mt-6 text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                                    Excellent Match
                                </span>
                                <p className="text-sm text-slate-500 mt-3 px-4">
                                    Candidate shows strong alignment with role requirements, particularly in architectural patterns.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Sub-metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {metrics.map((m, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className={`p-2 rounded-lg bg-${m.color}-500/10 text-${m.color}-500`}>
                                        <span className="material-icons-round text-xl">{m.icon}</span>
                                    </div>
                                    <span className="text-xl font-bold text-slate-900">{m.score}%</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600">{m.label}</p>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className={`bg-${m.color}-500 h-1.5 rounded-full`} style={{ width: `${m.score}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        {/* Strengths */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                    <span className="material-icons-round text-sm">thumb_up</span>
                                </div>
                                <h3 className="font-semibold text-lg">Key Strengths</h3>
                            </div>
                            <ul className="space-y-4 flex-grow">
                                {strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-icons-round text-green-500 text-lg mt-0.5">check_circle</span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <button className="text-primary text-sm font-medium hover:text-primary-dark flex items-center gap-1 transition-colors">
                                    View detailed transcript
                                    <span className="material-icons-round text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>

                        {/* Improvements */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <span className="material-icons-round text-sm">trending_up</span>
                                </div>
                                <h3 className="font-semibold text-lg">Areas for Growth</h3>
                            </div>
                            <ul className="space-y-4 flex-grow">
                                {improvements.map((imp, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                        <span className="material-icons-round text-orange-400 text-lg mt-0.5">info</span>
                                        <span>{imp}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <button className="text-primary text-sm font-medium hover:text-primary-dark flex items-center gap-1 transition-colors">
                                    See recommended resources
                                    <span className="material-icons-round text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Footer */}
            <div className="bg-primary/5 rounded-2xl p-6 sm:p-10 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50 pointer-events-none"></div>
                <div className="relative z-10 text-center md:text-left">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ready for the next round?</h3>
                    <p className="text-slate-500 max-w-xl">Upload a new resume or select a different role template to begin a new AI-powered interview session.</p>
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Link to="/configure" className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto flex items-center justify-center gap-2">
                        <span className="material-icons-round">add_circle</span>
                        Start New Interview
                    </Link>
                </div>
            </div>
        </div>
    )
}
