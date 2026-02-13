import { Link } from 'react-router-dom'

const practiceCards = [
    {
        color: 'indigo',
        icon: 'book',
        category: 'Technical Interview',
        title: 'Data Structures & Algorithms Foundations',
        desc: 'A comprehensive set of questions covering Linked Lists, Trees, and Sorting algorithms.',
        time: '45 mins',
    },
    {
        color: 'emerald',
        icon: 'briefcase',
        category: 'Behavioral',
        title: 'STAR Method Mastery Workshop',
        desc: 'Common behavioral questions used by FAANG companies to evaluate cultural fit and leadership.',
        time: '30 mins',
    },
    {
        color: 'amber',
        icon: 'school',
        category: 'Product Management',
        title: 'Product Strategy & Case Studies',
        desc: 'Learn how to approach product design and estimation questions for senior roles.',
        time: '60 mins',
    },
]

const recentInterviews = [
    { role: 'Senior Frontend Engineer', date: 'Oct 24, 2023', score: 92, color: 'emerald', duration: '32m 15s' },
    { role: 'General Behavioral Practice', date: 'Oct 22, 2023', score: 76, color: 'amber', duration: '18m 42s' },
    { role: 'React Developer', date: 'Oct 20, 2023', score: 88, color: 'emerald', duration: '45m 03s' },
]

export default function Dashboard() {
    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Top Stats & Upload */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Performance Summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <span className="material-icons-round text-primary">analytics</span>
                        Performance Summary
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                                <span className="material-icons-round text-blue-500">assignment_turned_in</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Interviews Completed</p>
                                <p className="text-2xl font-bold">12</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-icons-round text-primary">stars</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Average Score</p>
                                <p className="text-2xl font-bold text-primary">84%</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500">Current Streak</p>
                                    <p className="text-lg font-bold">5 Days</p>
                                </div>
                                <span className="material-icons-round text-amber-500">local_fire_department</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Upload */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <span className="material-icons-round text-primary">upload_file</span>
                        Quick Upload
                    </h3>
                    <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center py-8 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-icons-round text-primary text-3xl">cloud_upload</span>
                        </div>
                        <p className="font-semibold text-slate-800 mb-1">Drag & Drop your Interview PDF</p>
                        <p className="text-sm text-slate-500 px-6 text-center">Supports PDF, DOCX and Text files up to 10MB. Our AI will analyze the JD and Resume.</p>
                        <Link
                            to="/configure"
                            className="mt-6 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-shadow shadow-lg shadow-primary/20"
                        >
                            Select Files
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recommended Practice */}
            <section className="mt-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Recommended Practice</h2>
                        <p className="text-sm text-slate-500">Based on your recent performance and interests</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 transition-colors">
                            <span className="material-icons-round text-slate-400">chevron_left</span>
                        </button>
                        <button className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 transition-colors">
                            <span className="material-icons-round text-slate-400">chevron_right</span>
                        </button>
                    </div>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar">
                    {practiceCards.map((card, i) => (
                        <div key={i} className="min-w-[320px] bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                            <div className={`h-32 bg-${card.color}-50 flex items-center justify-center`}>
                                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                                    <span className={`material-icons-round text-${card.color}-500 text-3xl`}>{card.icon}</span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <span className={`text-[10px] font-bold uppercase tracking-widest text-${card.color}-500 mb-2`}>{card.category}</span>
                                <h4 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{card.title}</h4>
                                <p className="text-sm text-slate-500 mb-6 flex-1">{card.desc}</p>
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <span className="material-icons-round text-sm">schedule</span>
                                        <span className="text-xs font-medium">{card.time}</span>
                                    </div>
                                    <Link to="/configure" className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                                        Start Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Add New Card */}
                    <div className="min-w-[320px] border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden flex flex-col bg-slate-50/50">
                        <div className="h-32 flex items-center justify-center">
                            <span className="material-icons-round text-slate-300 text-5xl">add_circle_outline</span>
                        </div>
                        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                            <h4 className="font-bold text-lg text-slate-500 mb-2">Your Own Material</h4>
                            <p className="text-sm text-slate-400 mb-6">Upload a job description or your resume to create a custom interview simulation.</p>
                            <Link to="/configure" className="px-6 py-2 border-2 border-slate-300 text-slate-500 text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors">
                                Add New
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Interviews Table */}
            <section className="mt-12 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg">Recent Interviews</h3>
                    <Link to="/history" className="text-primary text-sm font-semibold hover:underline">View All</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Role / Topic</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentInterviews.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-icons-round text-sm">description</span>
                                            </div>
                                            <span className="font-semibold text-sm">{item.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full bg-${item.color}-500`} style={{ width: `${item.score}%` }}></div>
                                            </div>
                                            <span className={`text-sm font-bold text-${item.color}-500`}>{item.score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.duration}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to="/results" className="text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-icons-round">more_vert</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
