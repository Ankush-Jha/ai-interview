import { useState, useCallback, useRef, useEffect } from 'react'

// ── ElevenLabs TTS ─────────────────────────────────────────────────
const ELEVEN_LABS_API = 'https://api.elevenlabs.io/v1/text-to-speech'
// Rachel - warm, professional female voice (free tier)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

function getElevenLabsKey(): string | null {
    return import.meta.env.VITE_ELEVENLABS_API_KEY || null
}

// ── Groq Whisper STT ───────────────────────────────────────────────
const GROQ_WHISPER_API = 'https://api.groq.com/openai/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-large-v3-turbo'

function getGroqKey(): string | null {
    return import.meta.env.VITE_GROQ_API_KEY || null
}

// ── Feature Detection ──────────────────────────────────────────────
const mediaRecorderSupported = typeof window !== 'undefined' && 'MediaRecorder' in window

// Fallback to browser TTS if no ElevenLabs key
const browserTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// Fallback to browser STT if no Groq key
const browserSttSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

// ── ElevenLabs Speech Synthesis Hook ───────────────────────────────
export function useSpeechSynthesis() {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [enabled, setEnabled] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const apiKey = getElevenLabsKey()
    const useElevenLabs = !!apiKey

    const speak = useCallback(async (text: string) => {
        if (!enabled) return

        // Stop any current audio
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        window.speechSynthesis?.cancel()

        if (useElevenLabs && apiKey) {
            // ── ElevenLabs TTS ──
            try {
                setIsSpeaking(true)
                const response = await fetch(`${ELEVEN_LABS_API}/${DEFAULT_VOICE_ID}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xi-api-key': apiKey,
                    },
                    body: JSON.stringify({
                        text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.8,
                            style: 0.3,
                            use_speaker_boost: true,
                        },
                    }),
                })

                if (!response.ok) {
                    console.warn('ElevenLabs TTS failed, falling back to browser TTS')
                    fallbackBrowserSpeak(text, setIsSpeaking)
                    return
                }

                const audioBlob = await response.blob()
                const audioUrl = URL.createObjectURL(audioBlob)
                const audio = new Audio(audioUrl)

                audio.onended = () => {
                    setIsSpeaking(false)
                    URL.revokeObjectURL(audioUrl)
                }
                audio.onerror = () => {
                    setIsSpeaking(false)
                    URL.revokeObjectURL(audioUrl)
                }

                audioRef.current = audio
                await audio.play()
            } catch (err) {
                console.warn('ElevenLabs error:', err)
                setIsSpeaking(false)
                fallbackBrowserSpeak(text, setIsSpeaking)
            }
        } else {
            // ── Browser TTS fallback ──
            fallbackBrowserSpeak(text, setIsSpeaking)
        }
    }, [enabled, useElevenLabs, apiKey])

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        window.speechSynthesis?.cancel()
        setIsSpeaking(false)
    }, [])

    const toggleEnabled = useCallback(() => {
        setEnabled((prev) => {
            if (prev) {
                if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current = null
                }
                window.speechSynthesis?.cancel()
                setIsSpeaking(false)
            }
            return !prev
        })
    }, [])

    return {
        speak,
        stop,
        isSpeaking,
        enabled,
        toggleEnabled,
        supported: true, // always supported (browser fallback)
        engine: useElevenLabs ? 'elevenlabs' : 'browser',
    }
}

// Browser TTS fallback
function fallbackBrowserSpeak(text: string, setIsSpeaking: (v: boolean) => void) {
    if (!browserTtsSupported) {
        setIsSpeaking(false)
        return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(
        (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('natural') ||
                v.name.toLowerCase().includes('samantha') ||
                v.name.toLowerCase().includes('google'))
    )
    if (preferred) utterance.voice = preferred
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
}

// ── Groq Whisper Speech Recognition Hook ───────────────────────────
export function useSpeechRecognition() {
    const [isListening, setIsListening] = useState(false)
    const [liveTranscript, setLiveTranscript] = useState('')
    const [enabled, setEnabled] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const browserRecogRef = useRef<any>(null)

    const groqKey = getGroqKey()
    const useGroqWhisper = !!groqKey && mediaRecorderSupported

    // ── Groq Whisper: record → transcribe ──
    const startListening = useCallback(async () => {
        if (!enabled) return

        if (useGroqWhisper) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                streamRef.current = stream

                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
                chunksRef.current = []

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data)
                }

                mediaRecorder.onstop = async () => {
                    // Transcribe with Groq Whisper
                    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
                    if (audioBlob.size < 100) return // too short, skip

                    setIsProcessing(true)
                    try {
                        const formData = new FormData()
                        formData.append('file', audioBlob, 'recording.webm')
                        formData.append('model', WHISPER_MODEL)
                        formData.append('language', 'en')
                        formData.append('response_format', 'json')

                        const response = await fetch(GROQ_WHISPER_API, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${groqKey}`,
                            },
                            body: formData,
                        })

                        if (response.ok) {
                            const data = await response.json()
                            const text = data.text?.trim() || ''
                            if (text) {
                                setLiveTranscript((prev) => {
                                    const combined = prev ? `${prev} ${text}` : text
                                    return combined.trim()
                                })
                            }
                        } else {
                            console.warn('Groq Whisper failed:', await response.text())
                        }
                    } catch (err) {
                        console.warn('Whisper transcription error:', err)
                    } finally {
                        setIsProcessing(false)
                    }

                    // Clean up stream
                    stream.getTracks().forEach((t) => t.stop())
                    streamRef.current = null
                }

                mediaRecorder.start(3000) // Collect chunks every 3s for interim results
                mediaRecorderRef.current = mediaRecorder
                setIsListening(true)
            } catch (err) {
                console.warn('Microphone access failed:', err)
                setIsListening(false)
            }
        } else if (browserSttSupported) {
            // ── Browser SpeechRecognition fallback ──
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const w = window as any
            const SpeechRecog = w.SpeechRecognition ?? w.webkitSpeechRecognition
            if (!SpeechRecog) return

            const recognition = new SpeechRecog()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => setIsListening(false)
            recognition.onerror = () => setIsListening(false)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
                let final = ''
                let interim = ''
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i]
                    if (!result) continue
                    const text = result[0]?.transcript ?? ''
                    if (result.isFinal) {
                        final += text + ' '
                    } else {
                        interim += text
                    }
                }
                setLiveTranscript((final + interim).trim())
            }

            browserRecogRef.current = recognition
            recognition.start()
        }
    }, [enabled, useGroqWhisper, groqKey])

    const stopListening = useCallback(() => {
        // Stop Groq Whisper recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current = null
        }
        // Stop browser recognition
        if (browserRecogRef.current) {
            browserRecogRef.current.stop()
            browserRecogRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        setIsListening(false)
    }, [])

    const clearTranscript = useCallback(() => {
        setLiveTranscript('')
    }, [])

    const toggleEnabled = useCallback(() => {
        setEnabled((prev) => {
            if (prev) {
                stopListening()
            }
            return !prev
        })
    }, [stopListening])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop()
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
            }
            if (browserRecogRef.current) {
                browserRecogRef.current.stop()
            }
        }
    }, [])

    return {
        startListening,
        stopListening,
        clearTranscript,
        isListening,
        isProcessing,
        liveTranscript,
        enabled,
        toggleEnabled,
        supported: useGroqWhisper || browserSttSupported,
        engine: useGroqWhisper ? 'groq-whisper' : 'browser',
    }
}
