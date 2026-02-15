import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { useAuth } from '../context/AuthContext'
import { parsePDF } from '../lib/pdf-parser'
import { getInterviews } from '../lib/firestore'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Dashboard() {
    const { state, setDocument, setError, setStatus } = useInterview()
    const { user } = useAuth()
    useDocumentTitle('Dashboard', 'Upload documents and manage your AI interview sessions.')
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const [dragActive, setDragActive] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Load history
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(true)

    useEffect(() => {
        if (!user?.uid) return
        getInterviews(user.uid, 50)
            .then(setHistory)
            .catch(() => setHistory([]))
            .finally(() => setHistoryLoading(false))
    }, [user?.uid])

    const recentInterviews = history.slice(0, 5)
    const avgScore = history.length > 0
        ? Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / history.length)
        : 0
    const bestScore = history.length > 0
        ? Math.max(...history.map(h => h.score || 0))
        : 0
    const totalQuestions = history.reduce((sum, h) => sum + (h.questionCount || 0), 0)

    // Growth calc (mock — compare last 5 vs first 5)
    const growthPercent = history.length > 2
        ? Math.round(((history.slice(0, 3).reduce((s, h) => s + (h.score || 0), 0) / 3) -
            (history.slice(-3).reduce((s, h) => s + (h.score || 0), 0) / 3)))
        : 0

    const handleFile = useCallback(async (file) => {
        if (!file) return
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB.')
            return
        }

        setUploading(true)
        setStatus('uploading')
        try {
            const result = await parsePDF(file)
            if (!result.text || result.text.trim().length < 50) {
                setError('Could not extract enough text from this PDF.')
                setUploading(false)
                return
            }
            setDocument(result)
            setUploading(false)
            navigate('/configure')
        } catch (err) {
            setError('Failed to parse PDF: ' + err.message)
            setUploading(false)
        }
    }, [setDocument, setError, setStatus, navigate])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setDragActive(false)
        handleFile(e.dataTransfer.files?.[0])
    }, [handleFile])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setDragActive(true)
    }, [])

    const handleDragLeave = useCallback(() => setDragActive(false), [])

    // Dot matrix for activity visualization
    const activityDots = Array.from({ length: 60 }, (_, i) => {
        const hasActivity = history.some((h, idx) => idx % 7 === i % 7)
        return hasActivity && Math.random() > 0.4
    })

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
            {/* Error Banner */}
            {state.error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3">
                    <span className="material-icons-round text-red-500 text-lg">error</span>
                    <span className="text-sm flex-1">{state.error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                        <span className="material-icons-round text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Greeting */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
                </h1>
                <p className="text-slate-500 mt-1 text-sm">Here's your interview preparation overview.</p>
            </div>

            {/* ─────── Top Stats Grid ─────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {/* Interviews Completed */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500">Interviews Completed</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <span className="material-icons-round text-blue-500 text-lg">assignment_turned_in</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{history.length}</p>
                    <p className="text-xs text-slate-400 mt-1">total sessions</p>
                </div>

                {/* Average Score */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500">Average Score</span>
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-icons-round text-primary text-lg">stars</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-primary tracking-tight">{history.length > 0 ? `${avgScore}%` : '—'}</p>
                    </div>
                    {growthPercent !== 0 && (
                        <p className={`text-xs mt-1 flex items-center gap-0.5 ${growthPercent > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                            <span className="material-icons-round text-xs">{growthPercent > 0 ? 'trending_up' : 'trending_down'}</span>
                            {Math.abs(growthPercent)}% from earlier
                        </p>
                    )}
                </div>

                {/* Best Score */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500">Best Score</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                            <span className="material-icons-round text-amber-500 text-lg">emoji_events</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{history.length > 0 ? `${bestScore}%` : '—'}</p>
                    <p className="text-xs text-slate-400 mt-1">personal best</p>
                </div>

                {/* Questions Answered */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-slate-500">Questions Answered</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                            <span className="material-icons-round text-purple-500 text-lg">quiz</span>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{totalQuestions}</p>
                    <p className="text-xs text-slate-400 mt-1">across all sessions</p>
                </div>
            </div>

            {/* ─────── Middle Row: Upload + Activity ─────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-8">
                {/* Quick Upload — spans 3 */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-5 text-base">
                        <span className="material-icons-round text-primary text-xl">upload_file</span>
                        Start New Interview
                    </h3>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-10 transition-all cursor-pointer group ${dragActive
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : uploading
                                ? 'border-amber-300 bg-amber-50/50'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-primary/[0.02] hover:border-primary/40'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                        {uploading ? (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4 animate-pulse">
                                    <span className="material-icons-round text-amber-600 text-2xl animate-spin">sync</span>
                                </div>
                                <p className="font-semibold text-slate-800 mb-1">Parsing PDF...</p>
                                <p className="text-sm text-slate-500">Extracting text and analyzing structure</p>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-icons-round text-primary text-2xl">cloud_upload</span>
                                </div>
                                <p className="font-semibold text-slate-800 mb-1">Drag & Drop your Resume or Study Material</p>
                                <p className="text-sm text-slate-500 px-6 text-center">PDF files up to 10MB — AI will analyze and generate tailored interview questions.</p>
                                <span className="mt-5 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all shadow-sm group-hover:shadow-md group-hover:shadow-primary/20">
                                    Select File
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Activity Grid — spans 2 */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-shadow flex flex-col">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-5 text-base">
                        <span className="material-icons-round text-primary text-xl">calendar_today</span>
                        Practice Activity
                    </h3>

                    {/* Dot Matrix */}
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="grid grid-cols-10 gap-2 px-2">
                            {activityDots.map((active, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full transition-colors ${active ? 'bg-primary/60' : 'bg-slate-100'
                                        }`}
                                    title={active ? 'Active day' : 'No activity'}
                                />
                            ))}
                        </div>
                        <div className="flex items-center justify-between mt-4 px-2">
                            <span className="text-[10px] text-slate-400 font-medium">Less</span>
                            <div className="flex items-center gap-1">
                                {[0.1, 0.2, 0.4, 0.6, 0.8].map((op, i) => (
                                    <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `rgba(19,236,200,${op})` }} />
                                ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">More</span>
                        </div>
                    </div>

                    {/* Quick stat */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">This month</p>
                            <p className="text-lg font-bold text-slate-900">{Math.min(history.length, 12)} sessions</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {history.length > 3 ? '🔥 Active' : 'Getting started'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────── Recent Interviews ─────── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <span className="material-icons-round text-primary text-xl">history</span>
                        Recent Interviews
                    </h3>
                    {history.length > 0 && (
                        <Link to="/history" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                            View All
                            <span className="material-icons-round text-sm">chevron_right</span>
                        </Link>
                    )}
                </div>

                {recentInterviews.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-t border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-3">Document</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Score</th>
                                    <th className="px-6 py-3">Questions</th>
                                    <th className="px-6 py-3">Level</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentInterviews.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <span className="material-icons-round text-primary text-sm">description</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-900">{item.documentName || 'Interview'}</p>
                                                    <p className="text-xs text-slate-400">{item.questionCount || 0} questions</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500">{item.date}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${item.score}%` }}
                                                    />
                                                </div>
                                                <span className={`text-sm font-bold ${item.score >= 80 ? 'text-emerald-500' : item.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {item.score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{item.questionCount || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${item.score >= 80 ? 'bg-emerald-50 text-emerald-600'
                                                : item.score >= 60 ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-red-50 text-red-600'
                                                }`}>
                                                {item.score >= 80 ? 'Expert' : item.score >= 60 ? 'Intermediate' : 'Beginner'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to="/history" className="text-slate-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-slate-100 inline-flex">
                                                <span className="material-icons-round text-lg">arrow_forward</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center border-t border-slate-100">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons-round text-3xl text-slate-300">quiz</span>
                        </div>
                        <h4 className="font-bold text-slate-700 mb-1">No interviews yet</h4>
                        <p className="text-slate-400 text-sm">Upload a PDF above to start your first AI-powered interview session.</p>
                    </div>
                )}
            </div>

            {/* ─────── Quick Actions ─────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                <Link
                    to="/configure"
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 hover:shadow-md hover:border-primary/30 transition-all group"
                >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-icons-round text-primary text-xl">add_circle</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-900">New Interview</p>
                        <p className="text-xs text-slate-400">Configure and start a session</p>
                    </div>
                    <span className="material-icons-round text-slate-300 ml-auto group-hover:text-primary transition-colors">chevron_right</span>
                </Link>

                <Link
                    to="/history"
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 hover:shadow-md hover:border-primary/30 transition-all group"
                >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-icons-round text-blue-500 text-xl">history</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-900">View History</p>
                        <p className="text-xs text-slate-400">Review past sessions</p>
                    </div>
                    <span className="material-icons-round text-slate-300 ml-auto group-hover:text-primary transition-colors">chevron_right</span>
                </Link>

                <Link
                    to="/results"
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 hover:shadow-md hover:border-primary/30 transition-all group"
                >
                    <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-icons-round text-purple-500 text-xl">analytics</span>
                    </div>
                    <div>
                        <p className="font-bold text-sm text-slate-900">Latest Results</p>
                        <p className="text-xs text-slate-400">Detailed performance report</p>
                    </div>
                    <span className="material-icons-round text-slate-300 ml-auto group-hover:text-primary transition-colors">chevron_right</span>
                </Link>
            </div>
        </div>
    )
}
