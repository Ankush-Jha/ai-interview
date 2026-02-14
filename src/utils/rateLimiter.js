/**
 * Client-side rate limiter using a sliding window approach.
 * Prevents excessive API calls from the browser.
 */

const DEFAULT_MAX_CALLS = 3;
const DEFAULT_WINDOW_MS = 10000; // 10 seconds

class RateLimiter {
    constructor(maxCalls = DEFAULT_MAX_CALLS, windowMs = DEFAULT_WINDOW_MS) {
        this.maxCalls = maxCalls;
        this.windowMs = windowMs;
        this.timestamps = [];
    }

    /**
     * Check if a new call is allowed.
     * @returns {{ allowed: boolean, retryAfterMs: number }}
     */
    check() {
        const now = Date.now();
        // Remove timestamps outside the sliding window
        this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);

        if (this.timestamps.length >= this.maxCalls) {
            const oldestInWindow = this.timestamps[0];
            const retryAfterMs = this.windowMs - (now - oldestInWindow);
            return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
        }

        this.timestamps.push(now);
        return { allowed: true, retryAfterMs: 0 };
    }

    /**
     * Reset the rate limiter (e.g., on logout or session change).
     */
    reset() {
        this.timestamps = [];
    }
}

// Singleton instance: 3 AI calls per 10 seconds
export const aiRateLimiter = new RateLimiter(DEFAULT_MAX_CALLS, DEFAULT_WINDOW_MS);

export default RateLimiter;
