import { useState, useEffect, useCallback, useRef } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'

/**
 * VoiceControls — dedicated voice mode component for interview questions.
 * 
 * Features:
 * - Start/stop recording with visual feedback (pulsing mic, waveform indicator)
 * - Real-time transcript display (final + interim)
 * - Text-to-speech for AI responses
 * - Cross-browser support check
 * - Accessibility labels
 * 
 * Props:
 *  - onSubmit(transcript: string) — called when user submits their spoken answer
 *  - disabled: boolean — prevents interaction during evaluation
 *  - aiResponse: string — AI spoken response to read aloud
 *  - autoSpeak: boolean — auto-read AI feedback aloud
 */
export default function VoiceControls({
    onSubmit,
    disabled = false,
    aiResponse = '',
    autoSpeak = true,
}) {
    const {
        transcript,
        interimTranscript,
        isListening,
        isSupported: micSupported,
        start: startListening,
        stop: stopListening,
        reset: resetTranscript,
        error: micError,
    } = useSpeechRecognition({ continuous: true, interimResults: true })

    const {
        speak,
        stop: stopSpeaking,
        isSpeaking,
        isSupported: ttsSupported,
    } = useSpeechSynthesis()

    const [editedTranscript, setEditedTranscript] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const prevResponseRef = useRef('')

    // Sync transcript to edited text when not manually editing
    useEffect(() => {
        if (!isEditing) {
            setEditedTranscript(transcript)
        }
    }, [transcript, isEditing])

    // Auto-speak AI response when it changes
    useEffect(() => {
        if (autoSpeak && ttsSupported && aiResponse && aiResponse !== prevResponseRef.current) {
            prevResponseRef.current = aiResponse
            speak(aiResponse)
        }
    }, [aiResponse, autoSpeak, ttsSupported, speak])

    const handleToggleRecording = useCallback(() => {
        if (isListening) {
            stopListening()
        } else {
            resetTranscript()
            setEditedTranscript('')
            setIsEditing(false)
            startListening()
        }
    }, [isListening, startListening, stopListening, resetTranscript])

    const handleSubmit = useCallback(() => {
        const text = editedTranscript.trim()
        if (!text) return
        stopListening()
        onSubmit?.(text)
    }, [editedTranscript, stopListening, onSubmit])

    const handleClear = useCallback(() => {
        stopListening()
        resetTranscript()
        setEditedTranscript('')
        setIsEditing(false)
    }, [stopListening, resetTranscript])

    const fullTranscript = editedTranscript + (interimTranscript ? ` ${interimTranscript}` : '')

    // Unsupported browser
    if (!micSupported) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                <span className="material-icons-round text-3xl text-amber-500 mb-3">mic_off</span>
                <h3 className="font-bold text-amber-800 mb-2">Voice Not Supported</h3>
                <p className="text-sm text-amber-600">
                    Your browser doesn't support speech recognition.
                    Try Chrome or Edge for voice mode.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
            {/* Recording Controls */}
            <div className="flex items-center justify-center gap-6">
                {/* Main Mic Button */}
                <button
                    onClick={handleToggleRecording}
                    disabled={disabled}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 ${isListening
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/40 focus:ring-red-300'
                            : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/30 focus:ring-primary/30'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={isListening ? 'Stop recording' : 'Start recording'}
                >
                    {/* Pulse animation when recording */}
                    {isListening && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                            <span className="absolute inset-[-4px] rounded-full border-2 border-red-400 animate-pulse opacity-50" />
                        </>
                    )}
                    <span className="material-icons-round text-3xl relative z-10">
                        {isListening ? 'stop' : 'mic'}
                    </span>
                </button>

                {/* Status */}
                <div className="text-center min-w-[120px]">
                    <p className={`text-sm font-semibold ${isListening ? 'text-red-500' : 'text-slate-600'}`}>
                        {isListening ? '● Recording...' : disabled ? 'Processing...' : 'Tap to speak'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {isListening ? 'Click to stop' : 'Your answer will be transcribed'}
                    </p>
                </div>
            </div>

            {/* Waveform Indicator */}
            {isListening && (
                <div className="flex items-center justify-center gap-1 h-8" aria-hidden="true">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-red-400 rounded-full animate-pulse"
                            style={{
                                height: `${Math.random() * 24 + 8}px`,
                                animationDelay: `${i * 0.08}s`,
                                animationDuration: `${0.4 + Math.random() * 0.4}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Transcript Display */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                        Transcript
                    </label>
                    <div className="flex items-center gap-2">
                        {editedTranscript && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                            >
                                <span className="material-icons-round text-sm">
                                    {isEditing ? 'visibility' : 'edit'}
                                </span>
                                {isEditing ? 'Preview' : 'Edit'}
                            </button>
                        )}
                        {editedTranscript && (
                            <button
                                onClick={handleClear}
                                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                            >
                                <span className="material-icons-round text-sm">clear</span>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <textarea
                        value={editedTranscript}
                        onChange={(e) => setEditedTranscript(e.target.value)}
                        className="w-full min-h-[120px] p-4 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y transition-all"
                        placeholder="Edit your transcript..."
                    />
                ) : (
                    <div className={`min-h-[120px] p-4 rounded-xl text-sm leading-relaxed ${fullTranscript
                            ? 'bg-slate-50 text-slate-800 border border-slate-200'
                            : 'bg-slate-50/50 text-slate-400 border border-dashed border-slate-200'
                        }`}>
                        {fullTranscript || (
                            <span className="flex items-center gap-2">
                                <span className="material-icons-round text-lg opacity-50">mic</span>
                                Start speaking to see your transcript here...
                            </span>
                        )}
                        {interimTranscript && (
                            <span className="text-slate-400 italic"> {interimTranscript}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Error Display */}
            {micError && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                    <span className="material-icons-round text-sm">warning</span>
                    {micError}
                </div>
            )}

            {/* AI Speaking Indicator */}
            {isSpeaking && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <span className="material-icons-round text-sm animate-pulse">volume_up</span>
                    AI is speaking...
                    <button
                        onClick={stopSpeaking}
                        className="ml-auto text-blue-500 hover:text-blue-700 text-xs font-medium"
                    >
                        Stop
                    </button>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400">
                    You can edit the transcript before submitting
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={!editedTranscript.trim() || disabled}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                    >
                        <span className="material-icons-round text-lg">send</span>
                        Submit Answer
                    </button>
                </div>
            </div>
        </div>
    )
}
