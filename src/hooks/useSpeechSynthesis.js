import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Custom hook for Web Speech API speech synthesis (voice output).
 * Includes workarounds for Chrome bugs:
 *  - cancel-before-speak race condition
 *  - speechSynthesis freezing after long pauses
 */
export function useSpeechSynthesis() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const [error, setError] = useState(null);
    const utteranceRef = useRef(null);
    const voicesRef = useRef([]);

    const isSupported =
        typeof window !== "undefined" && "speechSynthesis" in window;

    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            setVoices(available);
            voicesRef.current = available;
        };

        loadVoices();
        window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

        // Chrome bug: speechSynthesis can freeze if idle too long.
        // Periodically resume to keep it alive.
        const keepAlive = setInterval(() => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            }
        }, 10000);

        return () => {
            clearInterval(keepAlive);
            window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
            window.speechSynthesis.cancel();
        };
    }, [isSupported]);

    const speak = useCallback(
        (text, options = {}) => {
            if (!isSupported) {
                setError("Speech synthesis not supported.");
                return;
            }
            if (!text?.trim()) return;

            // Cancel any current speech
            window.speechSynthesis.cancel();

            // Chrome workaround: small delay after cancel() to avoid race condition
            // where the new utterance gets immediately cancelled.
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = options.rate ?? 1.05;
                utterance.pitch = options.pitch ?? 1;
                utterance.volume = options.volume ?? 1;

                // Use latest voices from ref (avoids stale closure)
                const currentVoices = voicesRef.current;
                if (options.voice) {
                    utterance.voice = options.voice;
                } else if (currentVoices.length > 0) {
                    const preferred =
                        currentVoices.find(
                            (v) => v.lang.startsWith("en") && v.name.includes("Google")
                        ) || currentVoices.find((v) => v.lang.startsWith("en"));
                    if (preferred) utterance.voice = preferred;
                }

                utterance.onstart = () => {
                    setIsSpeaking(true);
                };
                utterance.onend = () => {
                    setIsSpeaking(false);
                };
                utterance.onerror = (e) => {
                    // "interrupted" and "canceled" are expected when we cancel speech
                    if (e.error !== "interrupted" && e.error !== "canceled") {
                        setError(`Speech error: ${e.error}`);
                    }
                    setIsSpeaking(false);
                };

                utteranceRef.current = utterance;
                window.speechSynthesis.speak(utterance);
            }, 50);
        },
        [isSupported]
    );

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    const pause = useCallback(() => {
        if (isSupported) window.speechSynthesis.pause();
    }, [isSupported]);

    const resume = useCallback(() => {
        if (isSupported) window.speechSynthesis.resume();
    }, [isSupported]);

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isSupported,
        voices,
        error,
    };
}
