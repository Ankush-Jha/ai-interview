import { useState } from 'react'
import { Link } from 'react-router-dom'

const personas = [
    { id: 'academic', icon: 'school', color: 'blue', label: 'Academic Professor', desc: 'Strict, detail-oriented, focuses on theoretical knowledge and definitions.' },
    { id: 'hr', icon: 'work', color: 'purple', label: 'HR Recruiter', desc: 'Professional, behavioral focus, asks about soft skills and culture fit.' },
    { id: 'peer', icon: 'sentiment_satisfied_alt', color: 'green', label: 'Friendly Peer', desc: 'Casual tone, collaborative approach, focuses on practical understanding.' },
]

const questionTypes = [
    { id: 'mcq', icon: 'list_alt', label: 'Multiple Choice', desc: 'Quick knowledge checks', defaultOn: false },
    { id: 'open', icon: 'psychology', label: 'Open-Ended Analysis', desc: 'Deep dive explanations', defaultOn: true },
    { id: 'scenario', icon: 'extension', label: 'Scenario-based Problems', desc: 'Real-world application', defaultOn: true },
]

const difficultyLabels = ['Easy', 'Medium', 'Hard']
const difficultyInfo = [
    'Questions will be straightforward, focusing on basic recall and fundamental concepts.',
    'Questions will test core concepts with moderate depth, suitable for standard interview preparation.',
    'Advanced questions requiring deep analytical thinking and expert-level understanding.',
]

export default function Configuration() {
    const [persona, setPersona] = useState('academic')
    const [difficulty, setDifficulty] = useState(1) // 0=Easy, 1=Medium, 2=Hard
    const [toggles, setToggles] = useState({ mcq: false, open: true, scenario: true })

    return (
        <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {/* Breadcrumb */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <span>Dashboard</span>
                    <span className="material-icons-round text-sm">chevron_right</span>
                    <span className="text-primary font-medium">New Session</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Configure Your Interview</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">Upload your PDF source material and customize the AI interviewer's persona to match your preparation goals.</p>
            </div>

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
                                    {/* Radio indicator */}
                                    <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${persona === p.id ? 'bg-primary border-primary' : 'border-slate-300 bg-white'
                                        }`}>
                                        {persona === p.id && <span className="material-icons-round text-white text-xs">check</span>}
                                    </div>
                                </button>
                            ))}
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
                                        {difficultyLabels.map((label, i) => (
                                            <span key={label} className={`cursor-pointer transition-colors ${difficulty === i ? 'text-primary font-bold' : 'hover:text-primary'}`}>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
                                    <span className="material-icons-round text-blue-600 mt-0.5">info</span>
                                    <div>
                                        <p className="text-sm text-blue-900 font-medium">{difficultyLabels[difficulty]} Difficulty</p>
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
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-5 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="material-icons-round text-lg text-primary">description</span>
                        <span>Currently analyzing: <span className="font-medium text-slate-900">Machine_Learning_Notes_Ch1.pdf</span></span>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link to="/" className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors text-center">
                            Cancel
                        </Link>
                        <Link
                            to="/session"
                            className="w-full md:w-auto px-8 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <span>Start Interview</span>
                            <span className="material-icons-round text-sm">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
