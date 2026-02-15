/**
 * AI Interview Platform — Express Backend
 * 
 * Proxies all Hugging Face API calls server-side to keep tokens secure.
 * Handles PDF parsing, code sandboxing, and rate limiting.
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

import { authMiddleware } from './middleware/auth.js'
import { createRateLimiter } from './middleware/rateLimit.js'
import aiRoutes from './routes/ai.js'
import uploadRoutes from './routes/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// ─── Security ────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS — allow configured origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',').map(s => s.trim())

app.use(cors({
    origin(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.) in dev
        if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        callback(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Body Parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))

// ─── Rate Limiting ───────────────────────────────────────────────────
const apiLimiter = createRateLimiter({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30'),
})

// ─── Health Check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    })
})

// ─── API Routes (protected) ─────────────────────────────────────────
app.use('/api', apiLimiter)
app.use('/api', authMiddleware)
app.use('/api', aiRoutes)
app.use('/api', uploadRoutes)

// ─── Global Error Handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(`[ERROR] ${err.message}`)
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack)
    }

    // CORS errors
    if (err.message?.startsWith('CORS:')) {
        return res.status(403).json({ error: 'Forbidden', message: err.message })
    }

    // Multer file size errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large', message: 'PDF must be under 50MB' })
    }

    const status = err.status || err.statusCode || 500
    res.status(status).json({
        error: err.name || 'InternalError',
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong. Please try again.'
            : err.message,
    })
})

// ─── Start Server ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   AI Interview Server                          ║
║   Running on http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                 ║
╚════════════════════════════════════════════════╝
    `)
})

export default app
