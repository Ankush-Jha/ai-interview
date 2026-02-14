import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInterviews, deleteInterview, clearInterviews } from '../lib/firestore'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function History() {
    const { user } = useAuth()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    useDocumentTitle('Interview History', 'Review your past AI interview sessions and scores.')

    useEffect(() => {
        if (!user?.uid) return
        getInterviews(user.uid)
            .then(setHistory)
            .catch(() => setHistory([]))
            .finally(() => setLoading(false))
    }, [user?.uid])

    const handleClear = async () => {
        if (window.confirm('Are you sure you want to clear all interview history?')) {
            await clearInterviews(user.uid)
            setHistory([])
        }
    }

    const handleDelete = async (id) => {
        await deleteInterview(user.uid, id)
        setHistory(prev => prev.filter(h => h.id !== id))
    }

    const totalInterviews = history.length
    const avgScore = totalInterviews > 0
        ? Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / totalInterviews)
        : 0
    const bestScore = totalInterviews > 0 ? Math.max(...history.map(h => h.score || 0)) : 0

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Interview History</h1>
                    <p className="text-slate-500 mt-1">Review past interview sessions and track your improvement over time.</p>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <span className="material-icons-round text-base">delete_sweep</span>
                        Clear All
                    </button>
                )}
            </div>

            {/* Stats */}
            {history.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Interviews', value: totalInterviews, icon: 'assignment', color: 'blue' },
                        { label: 'Average Score', value: `${avgScore}%`, icon: 'analytics', color: 'primary' },
                        { label: 'Best Score', value: `${bestScore}%`, icon: 'emoji_events', color: 'amber' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-${stat.color === 'primary' ? 'primary' : stat.color}-500/10 flex items-center justify-center`}>
                                <span className={`material-icons-round text-${stat.color === 'primary' ? 'primary' : stat.color}-500 text-2xl`}>{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* History Table */}
            {history.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Document</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Difficulty</th>
                                    <th className="px-6 py-4">Questions</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <span className="material-icons-round text-sm">description</span>
                                                </div>
                                                <span className="font-semibold text-sm text-slate-900">{item.documentName || 'Interview'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${item.score}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-sm font-bold ${item.score >= 80 ? 'text-emerald-500' : item.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {item.score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${item.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                                                item.difficulty === 'hard' ? 'bg-red-50 text-red-600' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>{item.difficulty || 'medium'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{item.questionCount || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                title="Delete"
                                            >
                                                <span className="material-icons-round text-lg">delete_outline</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                    <span className="material-icons-round text-5xl text-slate-300 mb-4">history</span>
                    <h3 className="font-bold text-lg text-slate-700 mb-2">No interview history</h3>
                    <p className="text-slate-500 text-sm mb-6">Complete your first interview to start building your history.</p>
                    <Link to="/" className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        Start First Interview
                    </Link>
                </div>
            )}
        </div>
    )
}
