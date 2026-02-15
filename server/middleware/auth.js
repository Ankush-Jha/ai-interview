/**
 * Firebase Auth Middleware
 * 
 * Verifies Firebase ID tokens from the Authorization header.
 * In development mode, allows unauthenticated requests for easier testing.
 */
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

// Initialize Firebase Admin SDK
let firebaseInitialized = false

function initFirebase() {
    if (firebaseInitialized) return

    try {
        // Option 1: Service account JSON path
        if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const serviceAccount = JSON.parse(
                readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
            )
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
            firebaseInitialized = true
        }
        // Option 2: Inline JSON (base64 or raw)
        else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            let json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
            // Try base64 decode
            try { json = Buffer.from(json, 'base64').toString('utf8') } catch { /* raw JSON */ }
            admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) })
            firebaseInitialized = true
        }
        // Option 3: Default credentials (GCP environments)
        else {
            admin.initializeApp()
            firebaseInitialized = true
        }
    } catch (err) {
        console.warn('[Auth] Firebase Admin init failed:', err.message)
        console.warn('[Auth] Running in development mode — auth verification disabled')
    }
}

// Init on module load
initFirebase()

/**
 * Auth middleware — verifies Firebase ID token from Authorization header.
 * In development, allows requests through with a mock user if no Firebase is configured.
 */
export async function authMiddleware(req, res, next) {
    // Development bypass: skip all auth verification in non-production
    if (process.env.NODE_ENV !== 'production') {
        req.user = { uid: 'dev-user', email: 'dev@localhost' }
        return next()
    }

    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header. Expected: Bearer <firebase-id-token>',
        })
    }

    const idToken = authHeader.split('Bearer ')[1]

    try {
        const decoded = await admin.auth().verifyIdToken(idToken)
        req.user = {
            uid: decoded.uid,
            email: decoded.email || null,
            name: decoded.name || null,
        }
        next()
    } catch (err) {
        console.warn('[Auth] Token verification failed:', err.code || err.message)

        if (err.code === 'auth/id-token-expired') {
            return res.status(401).json({
                error: 'TokenExpired',
                message: 'Your session has expired. Please sign in again.',
            })
        }

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authentication token.',
        })
    }
}
