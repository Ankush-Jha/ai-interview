import { useCallback } from 'react';

// Use simple Web Audio API waveforms — no external assets required
const SOUNDS = {
    // High-low chirp (submit)
    submitted: [440, 880],
    // C major triad (success)
    success: [523.25, 659.25, 783.99],
    // Low tone drop (skip)
    skip: [300, 200],
    // C major arpeggio (session complete)
    complete: [523.25, 659.25, 783.99, 1046.50],
    // Soft error buzz
    error: [150, 100]
};

export function useSoundEffects() {
    const playSound = useCallback((type) => {
        // Safe guard for SSR or environments without audio support
        if (typeof window === 'undefined' || !window.AudioContext) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const frequencies = SOUNDS[type];

            if (!frequencies) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            // Play sequence of tones
            frequencies.forEach((freq, i) => {
                osc.frequency.setValueAtTime(freq, now + i * 0.1);
            });

            // Gentle attack and release to avoid clicking
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.exponentialRampToValueAtTime(0.1, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (frequencies.length * 0.1) + 0.1);

            osc.start(now);
            osc.stop(now + (frequencies.length * 0.1) + 0.2);

        } catch (e) {
            console.warn('Audio play failed', e);
        }
    }, []);

    return { playSound };
}
