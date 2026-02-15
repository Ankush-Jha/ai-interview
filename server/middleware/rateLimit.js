/**
 * Rate Limiting Middleware
 * 
 * Per-user sliding window rate limiter using express-rate-limit.
 * Keys by Firebase UID (from auth middleware) or IP for unauthenticated requests.
 */
import rateLimit from 'express-rate-limit'

/**
 * Create a rate limiter instance.
 * @param {{ windowMs?: number, max?: number }} options
 */
export function createRateLimiter(options = {}) {
    const {
        windowMs = 60_000,  // 1 minute window
        max = 30,           // 30 requests per window
    } = options

    return rateLimit({
        windowMs,
        max,

        // Key by authenticated user ID, fall back to IP
        keyGenerator(req) {
            return req.user?.uid || req.ip
        },

        // Custom response
        handler(_req, res) {
            res.status(429).json({
                error: 'RateLimitExceeded',
                message: 'Too many requests. Please wait a moment before trying again.',
                retryAfter: Math.ceil(windowMs / 1000),
            })
        },

        // Standard headers
        standardHeaders: 'draft-7',
        legacyHeaders: false,

        // Skip health check
        skip(req) {
            return req.path === '/api/health'
        },
    })
}
