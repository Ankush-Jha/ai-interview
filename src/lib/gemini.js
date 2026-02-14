import { HfInference } from "@huggingface/inference";
import {
    buildAnalyzePrompt,
    buildQuestionsPrompt,
    buildEvaluatePrompt,
    buildReportPrompt,
    buildModeDetectionPrompt,
    buildCodingQuestionsPrompt,
    buildCodeEvalPrompt,
    buildConversationalEvalPrompt,
    buildFollowUpPrompt,
    buildTransitionPrompt,
    buildIntroPrompt,
    buildWrapUpPrompt,
    buildDifficultyAdaptation,
    humanizeResponse,
} from "../utils/prompts";
import { aiRateLimiter } from "../utils/rateLimiter";

// ─── Task-specific model chains (from user research) ────────────────────────
// Each chain is ordered by preference with fallbacks.

// Overall best balance: conversation + evaluation + RAG
const MODELS = [
    "Qwen/Qwen3-72B",
    "deepseek-ai/DeepSeek-V3",
    "microsoft/Phi-4-mini-instruct",
];

// Best for answer evaluation & scoring (strong reasoning)
const EVAL_MODELS = [
    "moonshotai/Kimi-K2.5",
    "Qwen/Qwen3-72B",
    "deepseek-ai/DeepSeek-V3",
];

// Question generation + adaptive interviewer
const QUESTION_MODELS = [
    "THUDM/GLM-4-9B-Chat",
    "Qwen/Qwen3-72B",
    "deepseek-ai/DeepSeek-V3",
];

// Document analysis / RAG
const DOC_MODELS = [
    "deepseek-ai/DeepSeek-V3",
    "Qwen/Qwen3-72B",
    "microsoft/Phi-4-mini-instruct",
];

// Code-specific chain
const CODE_MODELS = [
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "deepseek-ai/DeepSeek-V3",
    "Qwen/Qwen3-72B",
];

function getClient() {
    const key = import.meta.env.VITE_HF_TOKEN;
    if (!key) throw new ApiError("VITE_HF_TOKEN is not set in .env.local", "auth");
    return new HfInference(key);
}

// ─── Centralized API Error Handling ─────────────────────────────────────────

export class ApiError extends Error {
    constructor(message, code = 'unknown', retryable = false) {
        super(message);
        this.name = 'ApiError';
        this.code = code;       // rate_limit | auth | network | parse | timeout | model_unavailable | unknown
        this.retryable = retryable;
        this.userMessage = ApiError.getUserMessage(code);
    }

    static getUserMessage(code) {
        const messages = {
            rate_limit: "The AI is getting too many requests right now. Please wait a moment and try again.",
            auth: "There's an issue with the API authentication. Please check your configuration.",
            network: "Network connection issue. Please check your internet and try again.",
            parse: "The AI returned an unexpected response. Retrying may help.",
            timeout: "The AI took too long to respond. Let's try again.",
            model_unavailable: "The AI model is currently unavailable. Trying an alternative...",
            unknown: "Something unexpected happened. Please try again.",
        };
        return messages[code] || messages.unknown;
    }
}

function classifyError(err) {
    const msg = (err.message || '').toLowerCase();

    if (msg.includes('rate') || msg.includes('429') || msg.includes('too many'))
        return new ApiError(err.message, 'rate_limit', true);
    if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden'))
        return new ApiError(err.message, 'auth', false);
    if (msg.includes('timed out') || msg.includes('timeout'))
        return new ApiError(err.message, 'timeout', true);
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED'))
        return new ApiError(err.message, 'network', true);
    if (msg.includes('json') || msg.includes('parse') || msg.includes('could not parse'))
        return new ApiError(err.message, 'parse', true);
    if (msg.includes('404') || msg.includes('not found'))
        return new ApiError(err.message, 'model_unavailable', true);

    return new ApiError(err.message, 'unknown', true);
}

/**
 * Call HuggingFace model with retry + fallback chain.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {string[]} modelChain
 * @param {{ temperature?: number, timeout?: number }} options
 */
async function callModel(systemPrompt, userPrompt, modelChain = MODELS, options = {}) {
    const { temperature = 0.7, timeout = 45000 } = options;

    // Client-side rate limiting
    const { allowed, retryAfterMs } = aiRateLimiter.check();
    if (!allowed) {
        throw new ApiError(
            `Rate limited. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`,
            'rate_limit',
            true
        );
    }

    const client = getClient();
    let lastError = null;

    for (const model of modelChain) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await Promise.race([
                    client.chatCompletion({
                        model,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt },
                        ],
                        max_tokens: 4096,
                        temperature,
                        top_p: 0.9,
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Request timed out")), timeout)
                    ),
                ]);

                const text = response.choices?.[0]?.message?.content?.trim();
                if (!text) throw new Error("Empty response");

                const parsed = extractJSON(text);
                console.log(`[AI] ✅ Model responded: ${model}`);
                return humanizeResponse(parsed);
            } catch (err) {
                lastError = classifyError(err);
                console.warn(`[AI] ❌ ${model} attempt ${attempt + 1} failed [${lastError.code}]:`, err.message);
                if (attempt < 1 && lastError.retryable) {
                    // Exponential backoff: 2s, then 4s
                    await new Promise((r) => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
                } else if (!lastError.retryable) {
                    throw lastError; // Non-retryable errors abort immediately
                }
            }
        }
        console.warn(`[AI] Switching from ${model} to next fallback...`);
    }

    throw lastError || new ApiError(
        "All AI models failed. Please try again in a moment.",
        "unknown",
        true
    );
}

/**
 * Sanitize model output: strip control chars (except newlines/tabs) that break JSON.parse.
 */
function sanitizeModelOutput(text) {
    // Remove control characters except \n, \r, \t
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// ─── Schema Definitions & Validation ────────────────────────────────────────

const SCHEMAS = {
    evaluation: {
        required: { score: 0, feedback: 'No feedback available.' },
        optional: ['strengths', 'weakness', 'tip', 'decision', 'follow_up'],
    },
    question: {
        required: { question: '', type: 'open-ended', difficulty: 'medium', topic: 'General' },
        optional: ['options', 'correct_answer', 'context'],
    },
    report: {
        required: { overallScore: 0, strengths: [], weaknesses: [], recommendations: [] },
        optional: ['summary', 'tips', 'highlights'],
    },
};

/**
 * Validate parsed JSON against a schema, filling in missing required keys with defaults.
 * @param {any} parsed - Parsed JSON object or array
 * @param {string} [schemaName] - Optional schema name to validate against
 * @returns {any} - Validated/filled object
 */
function validateAndFill(parsed, schemaName) {
    if (!schemaName || !SCHEMAS[schemaName]) return parsed;
    const schema = SCHEMAS[schemaName];

    // Handle arrays of objects (e.g., question lists)
    if (Array.isArray(parsed)) {
        return parsed.map(item =>
            typeof item === 'object' && item !== null ? validateAndFill(item, schemaName) : item
        );
    }

    // Handle single objects
    if (typeof parsed === 'object' && parsed !== null) {
        for (const [key, defaultVal] of Object.entries(schema.required)) {
            if (!(key in parsed) || parsed[key] === undefined || parsed[key] === null) {
                parsed[key] = defaultVal;
                console.warn(`[AI] Schema validation: filled missing key "${key}" with default`);
            }
        }
    }

    return parsed;
}

/**
 * Extract JSON from model response with multiple fallback strategies.
 * @param {string} rawText - Raw model output
 * @param {string} [schema] - Optional schema name for validation ('evaluation', 'question', 'report')
 */
function extractJSON(rawText, schema) {
    const text = sanitizeModelOutput(rawText);

    // Strategy 1: Extract from markdown code fences (```json ... ``` or ``` ... ```)
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
        try { return validateAndFill(JSON.parse(fenced[1].trim()), schema); } catch { /* fall through */ }
    }

    // Strategy 2: Direct parse (model returned clean JSON)
    try { return validateAndFill(JSON.parse(text), schema); } catch { /* fall through */ }

    // Strategy 3: Find the outermost JSON array or object (non-greedy for arrays, greedy for objects)
    const arrayMatch = text.match(/(\[\s*\{[\s\S]*\}\s*\])/);
    if (arrayMatch) {
        try { return validateAndFill(JSON.parse(arrayMatch[1]), schema); } catch { /* fall through */ }
    }
    const objectMatch = text.match(/(\{[\s\S]*\})/);
    if (objectMatch) {
        try { return validateAndFill(JSON.parse(objectMatch[1]), schema); } catch { /* fall through */ }
    }

    // All strategies failed — throw with a preview of what the model returned
    const preview = text.slice(0, 200).replace(/\n/g, ' ');
    throw new Error(`Could not parse AI response as JSON. Preview: "${preview}..."`);
}


// ─── Public API ──────────────────────────────────────────────────────────────

export async function analyzeContent(text) {
    const { system, user } = buildAnalyzePrompt(text);
    return callModel(system, user, DOC_MODELS);
}

export async function generateQuestions(content, config) {
    const { system, user } = buildQuestionsPrompt(content, config);
    return callModel(system, user, QUESTION_MODELS);
}

export async function evaluateAnswer(question, userAnswer, context) {
    const { system, user } = buildEvaluatePrompt(question, userAnswer, context);
    return callModel(system, user, EVAL_MODELS, { temperature: 0.3 });
}

export async function generateReport(sessionData) {
    const { questions, answers, evaluations, settings } = sessionData;
    const qaPairs = questions.map((q, i) => ({
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        topic: q.topic,
        userAnswer: answers[i] || "(skipped)",
        score: evaluations[i]?.score ?? 0,
    }));
    const { system, user } = buildReportPrompt(qaPairs, settings, questions.length);
    return callModel(system, user, EVAL_MODELS);
}

// ─── Coding Mode Functions ───────────────────────────────────────────────────

export async function detectModes(text) {
    const { system, user } = buildModeDetectionPrompt(text);
    return callModel(system, user, DOC_MODELS);
}

export async function generateCodingQuestions(content, config) {
    const { system, user } = buildCodingQuestionsPrompt(content, config);
    return callModel(system, user, CODE_MODELS);
}

export async function evaluateCode(question, code, testResults, language) {
    const { system, user } = buildCodeEvalPrompt(question, code, testResults, language);
    return callModel(system, user, CODE_MODELS);
}

// ─── Conversational Interview Functions ──────────────────────────────────────

export async function respondToAnswer(question, answer, history, context) {
    const { system, user } = buildConversationalEvalPrompt(question, answer, history, context);
    return callModel(system, user, EVAL_MODELS, { temperature: 0.4 });
}

export async function generateFollowUp(question, answer, previousFollowUps) {
    const { system, user } = buildFollowUpPrompt(question, answer, previousFollowUps);
    return callModel(system, user, QUESTION_MODELS);
}

export async function generateTransition(fromPhase, toPhase, performance) {
    const { system, user } = buildTransitionPrompt(fromPhase, toPhase, performance);
    return callModel(system, user);
}

export async function generateIntro(topics, difficulty, questionCount) {
    const { system, user } = buildIntroPrompt(topics, difficulty, questionCount);
    return callModel(system, user);
}

export async function generateWrapUp(scores, topics) {
    const prompt = buildWrapUpPrompt(scores, topics);
    const result = await callModel(prompt.system, prompt.user, MODELS, { temperature: 0.7 });
    return result;
}

export async function generateDifficultyAdaptation(history, currentDifficulty) {
    const prompt = buildDifficultyAdaptation(history, currentDifficulty);
    // Use fast model for this decision
    const result = await callModel(prompt.system, prompt.user, DOC_MODELS, { temperature: 0.3 });
    return result;
}

export async function validateModels() {
    try {
        const client = getClient();
        await client.chatCompletion({
            model: MODELS[0],
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
        });
        console.log("[AI] ✅ Model validation successful");
        return true;
    } catch (err) {
        console.warn("[AI] ⚠️ Model validation failed:", err.message);
        return false;
    }
}
