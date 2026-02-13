"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Voice {
    name: string;
    lang: string;
    default: boolean;
    voiceURI: string;
}

interface UseSpeechSynthesisReturn {
    speak: (text: string, voiceName?: string) => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    isSpeaking: boolean;
    isPaused: boolean;
    isSupported: boolean;
    voices: Voice[];
    error: string | null;
}

/**
 * Custom hook wrapping the Web Speech API SpeechSynthesis interface.
 * Works across all major browsers. Provides speak, stop, pause, resume.
 */
export function useSpeechSynthesis(
    options: {
        rate?: number;
        pitch?: number;
        volume?: number;
        lang?: string;
    } = {}
): UseSpeechSynthesisReturn {
    const { rate = 1, pitch = 1, volume = 1, lang = "en-US" } = options;

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [error, setError] = useState<string | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const isSupported =
        typeof window !== "undefined" && "speechSynthesis" in window;

    // Load available voices
    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = () => {
            const synthVoices = window.speechSynthesis.getVoices();
            setVoices(
                synthVoices.map((v) => ({
                    name: v.name,
                    lang: v.lang,
                    default: v.default,
                    voiceURI: v.voiceURI,
                }))
            );
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [isSupported]);

    const speak = useCallback(
        (text: string, voiceName?: string) => {
            if (!isSupported) {
                setError("Speech synthesis is not supported in this browser.");
                return;
            }

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            setError(null);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = volume;
            utterance.lang = lang;

            // Set voice if specified
            if (voiceName) {
                const synthVoices = window.speechSynthesis.getVoices();
                const voice = synthVoices.find((v) => v.name === voiceName);
                if (voice) {
                    utterance.voice = voice;
                }
            }

            utterance.onstart = () => {
                setIsSpeaking(true);
                setIsPaused(false);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };

            utterance.onerror = (event) => {
                if (event.error !== "canceled") {
                    setError(`Speech synthesis error: ${event.error}`);
                }
                setIsSpeaking(false);
                setIsPaused(false);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        },
        [isSupported, rate, pitch, volume, lang]
    );

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setIsPaused(false);
        }
    }, [isSupported]);

    const pause = useCallback(() => {
        if (isSupported && isSpeaking) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    }, [isSupported, isSpeaking]);

    const resume = useCallback(() => {
        if (isSupported && isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    }, [isSupported, isPaused]);

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isPaused,
        isSupported,
        voices,
        error,
    };
}
