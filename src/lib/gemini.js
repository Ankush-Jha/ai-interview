/**
 * AI API Client — Thin proxy to the Express backend
 * 
 * All AI calls are routed through the backend server which holds
 * the HF token securely. This file replaces the previous direct
 * HuggingFace client-side calls.
 */
import { auth } from './firebase.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ─── Auth Helper ────────────────────────────────────────────────────
async function getAuthToken() {
    try {
        const user = auth.currentUser
        if (user) {
            return await user.getIdToken()
        }
    } catch {
        // Dev mode: no auth token
    }
    return null
}

// ─── API Error ──────────────────────────────────────────────────────
export class ApiError extends Error {
    constructor(message, code = 'unknown', retryable = false) {
        super(message)
        this.name = 'ApiError'
        this.code = code
        this.retryable = retryable
        this.userMessage = ApiError.getUserMessage(code)
    }

    static getUserMessage(code) {
        const messages = {
            rate_limit: 'AI is busy — please wait a moment.',
            auth: 'Please sign in again.',
            network: 'Network issue — check your connection.',
            parse: 'AI returned an unexpected response. Retrying...',
            timeout: 'AI is taking too long. Trying again...',
            server: 'Server error. Please try again.',
            unknown: 'Something went wrong.',
        }
        return messages[code] || messages.unknown
    }
}

// ─── Core Fetch ─────────────────────────────────────────────────────
async function apiCall(endpoint, body, options = {}) {
    const { retries = 1, timeout = 120000 } = options
    const token = await getAuthToken()

    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    let lastError = null
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeout)

            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: res.statusText }))
                const code = res.status === 429 ? 'rate_limit'
                    : res.status === 401 ? 'auth'
                        : res.status >= 500 ? 'server'
                            : 'unknown'
                throw new ApiError(errorData.message || res.statusText, code, res.status >= 500)
            }

            return await res.json()
        } catch (err) {
            lastError = err
            if (err.name === 'AbortError') {
                lastError = new ApiError('Request timed out', 'timeout', true)
            }
            if (err instanceof ApiError && !err.retryable) throw err
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
            }
        }
    }

    throw lastError
}

// ─── Public API (same function signatures as before) ────────────────

export async function analyzeContent(text) {
    return apiCall('/analyze', { text })
}

export async function generateQuestions(content, config) {
    return apiCall('/generate-questions', { content, config })
}

export async function evaluateAnswer(question, userAnswer, context) {
    return apiCall('/evaluate', { question, answer: userAnswer, context })
}

export async function generateReport(sessionData) {
    const { questions, answers, evaluations, settings } = sessionData || {}
    const qaPairs = (questions || []).map((q, i) => ({
        question: q.question,
        answer: answers?.[i] || '(no answer)',
        evaluation: evaluations?.[i] || null,
    }))
    return apiCall('/report', { qaPairs, settings, questionCount: questions?.length || 0 })
}

// ─── Coding Mode Functions ──────────────────────────────────────────

export async function detectModes(text) {
    return apiCall('/detect-modes', { text })
}

export async function generateCodingQuestions(content, config) {
    return apiCall('/generate-coding-questions', { content, config })
}

export async function evaluateCode(question, code, testResults, language) {
    return apiCall('/evaluate-code', { question, code, testResults, language })
}

// ─── Conversational Interview Functions ─────────────────────────────

export async function respondToAnswer(question, answer, history, context) {
    return apiCall('/evaluate-conversational', { question, answer, history, context })
}

export async function generateFollowUp(question, answer, previousFollowUps) {
    return apiCall('/generate-followup', { question, answer, previousFollowUps })
}

export async function generateTransition(fromPhase, toPhase, performance) {
    return apiCall('/generate-transition', { fromPhase, toPhase, performance })
}

export async function generateIntro(topics, difficulty, questionCount) {
    return apiCall('/generate-intro', { topics, difficulty, questionCount })
}

export async function generateWrapUp(scores, topics) {
    return apiCall('/generate-wrapup', { scores, topics })
}
