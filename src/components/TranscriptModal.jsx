import { useRef, useEffect } from 'react'

export default function TranscriptModal({ isOpen, onClose, history }) {
    const listRef = useRef(null)

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    // Scroll to bottom on open
    useEffect(() => {
        if (isOpen && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] relative z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Conversation Transcript</h2>
                        <p className="text-sm text-slate-500 mt-1">Full history of your interview session</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Message List */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
                >
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <span className="material-icons-round text-4xl mb-2">chat_bubble_outline</span>
                            <p>No conversation history found.</p>
                        </div>
                    ) : (
                        history.map((msg, i) => {
                            const isAi = msg.role === 'ai' || msg.role === 'system'
                            return (
                                <div key={i} className={`flex gap-4 ${isAi ? '' : 'flex-row-reverse'}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isAi ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        <span className="material-icons-round text-sm">
                                            {isAi ? 'smart_toy' : 'person'}
                                        </span>
                                    </div>

                                    {/* Bubble */}
                                    <div className={`flex flex-col max-w-[80%] ${isAi ? 'items-start' : 'items-end'}`}>
                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isAi
                                                ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                                                : 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/20'
                                            }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-xs text-slate-400 mt-1 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
