/**
 * Hugging Face Inference Client
 * 
 * Server-side HF API client with:
 * - Model chain fallback (primary → secondary → tertiary)
 * - Exponential backoff retry with jitter
 * - Structured JSON extraction with multiple fallback strategies
 * - Error classification and user-friendly messages
 */
import { HfInference } from '@huggingface/inference'

// ─── Model Chains ────────────────────────────────────────────────────
// General-purpose chain
const GENERAL_MODELS = [
    'deepseek-ai/DeepSeek-V3',
    'Qwen/Qwen3-72B',
    'meta-llama/Llama-3.3-70B-Instruct',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'microsoft/Phi-4-mini-instruct',
]

// Document analysis chain
const DOC_MODELS = [
    'deepseek-ai/DeepSeek-V3',
    'Qwen/Qwen3-72B',
    'meta-llama/Llama-3.3-70B-Instruct',
    'microsoft/Phi-4-mini-instruct',
]

// Code-specific chain
const CODE_MODELS = [
    'Qwen/Qwen2.5-Coder-32B-Instruct',
    'deepseek-ai/DeepSeek-V3',
    'Qwen/Qwen3-72B',
    'meta-llama/Llama-3.3-70B-Instruct',
]

// Conversational chain
const CONVERSATIONAL_MODELS = [
    'deepseek-ai/DeepSeek-V3',
    'Qwen/Qwen3-72B',
    'meta-llama/Llama-3.3-70B-Instruct',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'microsoft/Phi-4-mini-instruct',
]

// ─── Client Singleton ────────────────────────────────────────────────
let _client = null

function getClient() {
    if (!_client) {
        const token = process.env.HF_TOKEN
        if (!token) throw new HfApiError('HF_TOKEN not set in environment', 'auth')
        _client = new HfInference(token)
    }
    return _client
}

// ─── Error Handling ──────────────────────────────────────────────────
export class HfApiError extends Error {
    constructor(message, code = 'unknown', retryable = false) {
        super(message)
        this.name = 'HfApiError'
        this.code = code
        this.retryable = retryable
        this.userMessage = HfApiError.getUserMessage(code)
    }

    static getUserMessage(code) {
        const messages = {
            rate_limit: 'AI service is busy. Please wait a moment and try again.',
            auth: 'AI service authentication failed. Contact support.',
            network: 'Network issue connecting to AI. Please check your connection.',
            parse: 'AI returned an unexpected response. Retrying...',
            timeout: 'AI is taking too long. Please try again.',
            model_unavailable: 'AI model is temporarily unavailable. Trying alternative...',
            unknown: 'Something went wrong with the AI service.',
        }
        return messages[code] || messages.unknown
    }
}

function classifyError(err) {
    const msg = err?.message?.toLowerCase() || ''
    const status = err?.status || err?.statusCode

    if (status === 429 || msg.includes('rate limit')) return new HfApiError(msg, 'rate_limit', true)
    if (status === 401 || status === 403) return new HfApiError(msg, 'auth', false)
    if (status === 503 || msg.includes('loading')) return new HfApiError(msg, 'model_unavailable', true)
    if (msg.includes('timeout') || msg.includes('timed out')) return new HfApiError(msg, 'timeout', true)
    if (msg.includes('network') || msg.includes('fetch')) return new HfApiError(msg, 'network', true)
    // HF provider errors ("an http error occurred when requesting the provider") are retryable
    if (msg.includes('provider') || msg.includes('http error')) return new HfApiError(msg, 'model_unavailable', true)
    if (status >= 500) return new HfApiError(msg, 'model_unavailable', true)
    return new HfApiError(msg || 'Unknown HF API error', 'unknown', true)
}

// ─── Core API Call ───────────────────────────────────────────────────
/**
 * Call HuggingFace model with retry + fallback chain.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string[]} modelChain
 * @param {{ temperature?: number, maxTokens?: number, timeout?: number }} options
 * @returns {Promise<string>} Raw text response
 */
export async function callModel(systemPrompt, userPrompt, modelChain = GENERAL_MODELS, options = {}) {
    const {
        temperature = 0.7,
        maxTokens = 4096,
        timeout = 120_000,
    } = options

    const client = getClient()
    const errors = []

    for (const model of modelChain) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await client.chatCompletion({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature,
                    max_tokens: maxTokens,
                }, { signal: AbortSignal.timeout(timeout) })

                const text = response?.choices?.[0]?.message?.content
                if (!text?.trim()) throw new Error('Empty response from model')

                return text.trim()
            } catch (err) {
                const classified = classifyError(err)
                errors.push({ model, attempt, error: classified.message })
                console.warn(`[HF] ${model} attempt ${attempt + 1} failed:`, classified.code, classified.message)

                if (!classified.retryable) break

                // Exponential backoff with jitter
                const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 8000)
                await new Promise(r => setTimeout(r, delay))
            }
        }
    }

    console.error('[HF] All models failed:', JSON.stringify(errors, null, 2))
    throw new HfApiError(
        `All models exhausted. Last error: ${errors.at(-1)?.error}`,
        'model_unavailable',
        false
    )
}

// ─── JSON Extraction ─────────────────────────────────────────────────
/**
 * Sanitize model output — strip control chars that break JSON.parse.
 */
function sanitizeOutput(text) {
    return text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()
}

// Schema definitions for validation
const SCHEMAS = {
    evaluation: {
        required: { score: 5, strengths: [], improvements: [], response: '' },
        optional: ['reasoning', 'followUpQuestion', 'keywordsFound', 'keywordsMissed', 'action'],
    },
    question: {
        required: { question: '', topic: '' },
        optional: ['options', 'correct_answer', 'context', 'difficulty', 'mode', 'testCases'],
    },
    report: {
        required: { overallScore: 0, strengths: [], weaknesses: [], recommendations: [] },
        optional: ['summary', 'tips', 'highlights'],
    },
}

/**
 * Validate parsed JSON against a schema, filling in missing required keys.
 */
function validateAndFill(parsed, schemaName) {
    if (!schemaName || !SCHEMAS[schemaName]) return parsed
    const schema = SCHEMAS[schemaName]

    if (Array.isArray(parsed)) {
        return parsed.map(item => validateAndFill(item, schemaName))
    }

    if (typeof parsed === 'object' && parsed !== null) {
        for (const [key, defaultValue] of Object.entries(schema.required)) {
            if (!(key in parsed)) {
                parsed[key] = defaultValue
            }
        }
    }

    return parsed
}

/**
 * Extract JSON from model response with multiple fallback strategies.
 * @param {string} rawText
 * @param {string} [schemaName] - Optional schema for validation
 * @returns {any} Parsed JSON
 */
export function extractJSON(rawText, schemaName) {
    const cleaned = sanitizeOutput(rawText)

    // Strategy 1: Direct parse
    try {
        return validateAndFill(JSON.parse(cleaned), schemaName)
    } catch { /* continue */ }

    // Strategy 2: Find JSON block with regex
    const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)?.[0]
    if (jsonMatch) {
        try {
            return validateAndFill(JSON.parse(jsonMatch), schemaName)
        } catch { /* continue */ }
    }

    // Strategy 3: Fix common JSON issues (trailing commas, unescaped quotes)
    if (jsonMatch) {
        try {
            const fixed = jsonMatch
                .replace(/,\s*([\]}])/g, '$1')
                .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
            return validateAndFill(JSON.parse(fixed), schemaName)
        } catch { /* continue */ }
    }

    throw new HfApiError(`Failed to parse JSON from model output: ${cleaned.slice(0, 200)}`, 'parse', true)
}

// ─── Exported Model Chain Constants ──────────────────────────────────
export { GENERAL_MODELS, DOC_MODELS, CODE_MODELS, CONVERSATIONAL_MODELS }
