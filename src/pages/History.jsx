import { Link } from 'react-router-dom'

const stats = [
    { label: 'Total Completed', value: '12 Interviews', icon: 'assignment_turned_in', bg: 'blue', trend: '+12% this week', trendColor: 'green' },
    { label: 'Average Score', value: '78%', icon: 'trending_up', bg: 'green', trend: '+5 pts vs last month', trendColor: 'green' },
    { label: 'Total Practice Time', value: '5h 24m', icon: 'schedule', bg: 'purple', trend: 'Stable usage', trendColor: 'slate' },
]

const recentCards = [
    {
        name: 'Senior_PM_Resume.pdf', role: 'Product Manager Role • Today, 10:00 AM',
        score: '92/100', scoreBg: 'green', duration: '45 mins', focus: 'Behavioral',
        tip: 'Refine answers on stakeholder conflict resolution using the STAR method.',
        tipBg: 'amber',
    },
    {
        name: 'FullStack_Dev_CV_v2.pdf', role: 'Engineering Lead • Yesterday',
        score: 'In Progress', scoreBg: 'slate', duration: '12/20 Questions', focus: 'Technical',
        tip: 'You are currently being tested on System Design patterns.',
        tipBg: 'blue', inProgress: true,
    },
]

const allInterviews = [
    { name: 'Java_Developer_CV.pdf', date: 'Oct 24, 2023', duration: '28 mins', score: '65/100', scoreBg: 'orange', type: 'Coding', difficulty: 'Hard', typeBg: 'blue', diffBg: 'purple' },
    { name: 'Marketing_Strategy_V2.pdf', date: 'Oct 20, 2023', duration: '55 mins', score: '88/100', scoreBg: 'green', type: 'Case Study', difficulty: 'Medium', typeBg: 'indigo', diffBg: 'amber' },
    { name: 'Frontend_Resume_Draft.pdf', date: 'Oct 15, 2023', duration: '40 mins', score: '82/100', scoreBg: 'green', type: 'Theoretical', difficulty: 'Medium', typeBg: 'teal', diffBg: 'amber' },
    { name: 'Internship_Application.pdf', date: 'Oct 10, 2023', duration: '15 mins', score: '45/100', scoreBg: 'red', type: 'Behavioral', difficulty: 'Easy', typeBg: 'pink', diffBg: 'green' },
]

export default function History() {
    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Interview History</h1>
                    <p className="text-slate-500 mt-1">Review your past performance and track your progress.</p>
                </div>
                <Link to="/configure" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg shadow-lg shadow-primary/30 transition-all font-medium active:scale-95">
                    <span className="material-icons-round text-xl">add</span>
                    Start New Session
                </Link>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 shadow-card border border-slate-100 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-3">
                            <div className={`w-12 h-12 rounded-lg bg-${s.bg}-50 flex items-center justify-center text-${s.bg}-600`}>
                                <span className="material-icons-round text-2xl">{s.icon}</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                            </div>
                        </div>
                        <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-50">
                            <div className={`text-xs font-medium text-${s.trendColor}-600 flex items-center gap-1`}>
                                <span className="material-icons-round text-sm">{s.trendColor === 'green' ? 'arrow_upward' : 'remove'}</span>
                                {s.trend}
                            </div>
                            <svg className={`h-8 w-24 text-${s.bg}-500`} fill="none" stroke="currentColor" viewBox="0 0 100 30" width="100">
                                <path d="M0 25 C10 25, 10 10, 20 15 S 30 20, 40 10 S 50 15, 60 5 S 70 20, 80 15 S 90 5, 100 0" strokeLinecap="round" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <section className="mb-12">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="material-icons-round text-primary">history_toggle_off</span>
                    Recent Activity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentCards.map((card, i) => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-card border border-slate-100 relative overflow-hidden group hover:border-primary/30 transition-all flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none"></div>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                                            <span className="material-icons-round">picture_as_pdf</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{card.name}</h3>
                                            <p className="text-xs text-slate-500">{card.role}</p>
                                        </div>
                                    </div>
                                    <span className={`bg-${card.scoreBg}-100 text-${card.scoreBg}-700 text-xs font-bold px-2.5 py-1 rounded-full border border-${card.scoreBg}-200`}>
                                        {card.score}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{card.inProgress ? 'Completed' : 'Duration'}</span>
                                        <span className="text-sm font-medium text-slate-700">{card.duration}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Focus</span>
                                        <span className="text-sm font-medium text-slate-700">{card.focus}</span>
                                    </div>
                                </div>
                                <div className={`mb-5 bg-${card.tipBg}-50 border border-${card.tipBg}-100 p-3 rounded-lg flex gap-3 items-start`}>
                                    <span className={`material-icons-round text-${card.tipBg}-500 text-lg mt-0.5`}>{card.inProgress ? 'info' : 'lightbulb'}</span>
                                    <div>
                                        <p className={`text-xs font-bold text-${card.tipBg}-800 uppercase tracking-wide mb-1`}>{card.inProgress ? 'Current Focus' : 'Key Improvement Area'}</p>
                                        <p className="text-sm text-slate-700">{card.tip}</p>
                                    </div>
                                </div>
                            </div>
                            {card.inProgress ? (
                                <div className="flex gap-3">
                                    <Link to="/session" className="flex-1 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all text-sm flex items-center justify-center gap-2 active:scale-95">
                                        <span className="material-icons-round text-sm">play_arrow</span>
                                        Quick Resume
                                    </Link>
                                    <button className="px-3 py-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                                        <span className="material-icons-round">more_horiz</span>
                                    </button>
                                </div>
                            ) : (
                                <Link to="/results" className="w-full py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-primary transition-colors text-sm flex items-center justify-center gap-2">
                                    Review Feedback
                                    <span className="material-icons-round text-sm">arrow_forward</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* All Interviews Table */}
            <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-lg font-bold text-slate-800">All Interviews</h2>
                    <div className="flex items-center gap-3">
                        <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-primary hover:border-primary/30 transition-colors text-sm font-medium">
                            <span className="material-icons-round text-sm">file_download</span>
                            Bulk Export
                        </button>
                        <div className="relative group">
                            <span className="material-icons-round absolute left-3 top-2.5 text-slate-400 group-focus-within:text-primary">search</span>
                            <input className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full sm:w-64 transition-all" placeholder="Search sessions..." type="text" />
                        </div>
                        <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-primary hover:border-primary/30 transition-colors">
                            <span className="material-icons-round">filter_list</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-1 flex items-center justify-center">
                            <input className="rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                        </div>
                        <div className="col-span-4">Document Name</div>
                        <div className="col-span-2">Type & Difficulty</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-1">Score</div>
                        <div className="col-span-2 text-right">Action</div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-slate-100">
                        {allInterviews.map((item, i) => (
                            <div key={i} className="p-4 md:px-6 md:py-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center">
                                    <div className="hidden md:flex col-span-1 items-center justify-center">
                                        <input className="rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                                    </div>
                                    <div className="w-full md:col-span-4 flex items-center gap-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-50 flex-shrink-0 flex items-center justify-center text-red-500">
                                            <span className="material-icons-round text-lg md:text-xl">picture_as_pdf</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-slate-900 truncate text-sm md:text-base">{item.name}</h4>
                                            <p className="text-xs text-slate-500 truncate md:hidden">{item.date} • {item.type} • {item.difficulty}</p>
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-between md:contents text-sm">
                                        <div className="hidden md:block md:col-span-2">
                                            <div className="flex flex-wrap gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-${item.typeBg}-50 text-${item.typeBg}-700 border border-${item.typeBg}-100`}>{item.type}</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-${item.diffBg}-50 text-${item.diffBg}-700 border border-${item.diffBg}-100`}>{item.difficulty}</span>
                                            </div>
                                        </div>
                                        <div className="hidden md:block md:col-span-2 text-slate-600">
                                            <p>{item.date}</p>
                                            <p className="text-xs text-slate-400">{item.duration}</p>
                                        </div>
                                        <div className="md:col-span-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${item.scoreBg}-100 text-${item.scoreBg}-800 border border-${item.scoreBg}-200`}>
                                                {item.score}
                                            </span>
                                        </div>
                                        <div className="md:col-span-2 flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                                                <span className="material-icons-round text-lg">download</span>
                                            </button>
                                            <Link to="/results" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/10">
                                                Review
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
                        <div className="text-xs text-slate-500">
                            Showing <span className="font-semibold text-slate-900">1</span> to <span className="font-semibold text-slate-900">4</span> of <span className="font-semibold text-slate-900">12</span> results
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-400 cursor-not-allowed" disabled>Previous</button>
                            <button className="px-3 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors">Next</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
