"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseSpeechRecognitionReturn {
    transcript: string;
    interimTranscript: string;
    isListening: boolean;
    isSupported: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
    error: string | null;
}

/**
 * Custom hook wrapping the Web Speech API SpeechRecognition interface.
 * Works in Chrome and Edge. Falls back gracefully in unsupported browsers.
 */
export function useSpeechRecognition(
    options: {
        continuous?: boolean;
        interimResults?: boolean;
        lang?: string;
    } = {}
): UseSpeechRecognitionReturn {
    const {
        continuous = true,
        interimResults = true,
        lang = "en-US",
    } = options;

    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const isSupported =
        typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

    // Initialize recognition instance
    useEffect(() => {
        if (!isSupported) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();

        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = lang;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let final = "";
            let interim = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }

            if (final) {
                setTranscript((prev) => prev + final);
            }
            setInterimTranscript(interim);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            if (event.error !== "aborted") {
                setError(`Speech recognition error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript("");
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, [isSupported, continuous, interimResults, lang]);

    const start = useCallback(() => {
        if (!recognitionRef.current || !isSupported) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }
        setError(null);
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            if (e instanceof DOMException && e.name === "InvalidStateError") {
                setIsListening(true);
            } else {
                setError("Failed to start speech recognition.");
            }
        }
    }, [isSupported]);

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, []);

    const reset = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
        setError(null);
    }, []);

    return {
        transcript,
        interimTranscript,
        isListening,
        isSupported,
        start,
        stop,
        reset,
        error,
    };
}
