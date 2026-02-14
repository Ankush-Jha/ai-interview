import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInterview } from '../context/InterviewContext'
import { useAuth } from '../context/AuthContext'
import { parsePDF } from '../lib/pdf-parser'
import { getInterviews } from '../lib/firestore'
import { validateModels } from '../lib/gemini'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function Dashboard() {
    const { state, setDocument, setError, setStatus } = useInterview()
    const { user } = useAuth()
    useDocumentTitle('Dashboard', 'Upload documents and manage your AI interview sessions.')
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const [dragActive, setDragActive] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Load history from Firestore
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(true)

    useEffect(() => {
        if (!user?.uid) return
        getInterviews(user.uid, 50)
            .then(setHistory)
            .catch(() => setHistory([]))
            .finally(() => setHistoryLoading(false))
    }, [user?.uid])

    useEffect(() => {
        validateModels().then(ok => {
            if (!ok) setError('AI Service seems unavailable. Check your connection.')
        })
    }, [setError])

    const recentInterviews = history.slice(0, 3)
    const avgScore = history.length > 0
        ? Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / history.length)
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
                setError('Could not extract enough text from this PDF. It may be scanned or image-based.')
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
        const file = e.dataTransfer.files?.[0]
        handleFile(file)
    }, [handleFile])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setDragActive(true)
    }, [])

    const handleDragLeave = useCallback(() => setDragActive(false), [])

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
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
                                <p className="text-2xl font-bold">{history.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-icons-round text-primary">stars</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Average Score</p>
                                <p className="text-2xl font-bold text-primary">{history.length > 0 ? `${avgScore}%` : '—'}</p>
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
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-8 transition-all cursor-pointer group ${dragActive
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : uploading
                                ? 'border-amber-300 bg-amber-50'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
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
                                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-4 animate-pulse">
                                    <span className="material-icons-round text-amber-600 text-3xl animate-spin">sync</span>
                                </div>
                                <p className="font-semibold text-slate-800 mb-1">Parsing PDF...</p>
                                <p className="text-sm text-slate-500">Extracting text and analyzing structure</p>
                            </>
                        ) : (
                            <>
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="material-icons-round text-primary text-3xl">cloud_upload</span>
                                </div>
                                <p className="font-semibold text-slate-800 mb-1">Drag & Drop your Interview PDF</p>
                                <p className="text-sm text-slate-500 px-6 text-center">Supports PDF files up to 10MB. Our AI will analyze the content and generate questions.</p>
                                <span className="mt-6 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-shadow shadow-lg shadow-primary/20">
                                    Select Files
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Interviews Table */}
            {recentInterviews.length > 0 && (
                <section className="mt-12 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-lg">Recent Interviews</h3>
                        <Link to="/history" className="text-primary text-sm font-semibold hover:underline">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Document</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Questions</th>
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
                                                <span className="font-semibold text-sm">{item.documentName || 'Interview'}</span>
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
                                        <td className="px-6 py-4 text-sm text-slate-500">{item.questionCount || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to="/history" className="text-slate-400 hover:text-primary transition-colors">
                                                <span className="material-icons-round">more_vert</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Empty state if no history */}
            {recentInterviews.length === 0 && (
                <section className="mt-8 bg-white border border-slate-200 rounded-2xl p-10 text-center">
                    <span className="material-icons-round text-5xl text-slate-300 mb-4">quiz</span>
                    <h3 className="font-bold text-lg text-slate-700 mb-2">No interviews yet</h3>
                    <p className="text-slate-500 text-sm mb-6">Upload a PDF to start your first AI-powered interview session.</p>
                </section>
            )}
        </div>
    )
}
