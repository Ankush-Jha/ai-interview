/**
 * AI Proxy Routes
 * 
 * All AI-related endpoints that proxy to Hugging Face Inference API.
 * The HF token never leaves this server.
 */
import { Router } from 'express'
import {
    callModel,
    extractJSON,
    GENERAL_MODELS,
    DOC_MODELS,
    CODE_MODELS,
    CONVERSATIONAL_MODELS,
} from '../lib/hf-client.js'
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
    buildCoachingTipPrompt,
    humanizeResponse,
} from '../lib/prompts.js'

const router = Router()

// ─── Helper ──────────────────────────────────────────────────────────
function asyncHandler(fn) {
    return (req, res, next) => fn(req, res, next).catch(next)
}

// ─── POST /api/analyze ───────────────────────────────────────────────
// Analyze document content — extract topics, themes, difficulty
router.post('/analyze', asyncHandler(async (req, res) => {
    const { text } = req.body
    if (!text?.trim()) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "text" field' })
    }

    const prompt = buildAnalyzePrompt(text)
    const raw = await callModel(prompt.system, prompt.user, DOC_MODELS, { temperature: 0.3 })
    const result = extractJSON(raw)

    res.json(result)
}))

// ─── POST /api/detect-modes ─────────────────────────────────────────
// Detect coding/voice modes in document content
router.post('/detect-modes', asyncHandler(async (req, res) => {
    const { text } = req.body
    if (!text?.trim()) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "text" field' })
    }

    const prompt = buildModeDetectionPrompt(text)
    const raw = await callModel(prompt.system, prompt.user, DOC_MODELS, { temperature: 0.2 })
    const result = extractJSON(raw)

    res.json(result)
}))

// ─── POST /api/generate-questions ────────────────────────────────────
// Generate interview questions based on content + config
router.post('/generate-questions', asyncHandler(async (req, res) => {
    const { content, config } = req.body
    if (!content?.trim()) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "content" field' })
    }

    const prompt = buildQuestionsPrompt(content, config || {})
    const raw = await callModel(prompt.system, prompt.user, DOC_MODELS, { temperature: 0.8 })
    const result = extractJSON(raw, 'question')

    res.json(Array.isArray(result) ? result : [result])
}))

// ─── POST /api/generate-coding-questions ─────────────────────────────
// Generate coding-specific questions with test cases
router.post('/generate-coding-questions', asyncHandler(async (req, res) => {
    const { content, config } = req.body
    if (!content?.trim()) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "content" field' })
    }

    const prompt = buildCodingQuestionsPrompt(content, config || {})
    const raw = await callModel(prompt.system, prompt.user, CODE_MODELS, { temperature: 0.7 })
    const result = extractJSON(raw, 'question')

    res.json(Array.isArray(result) ? result : [result])
}))

// ─── POST /api/evaluate ─────────────────────────────────────────────
// Evaluate a candidate's answer
router.post('/evaluate', asyncHandler(async (req, res) => {
    const { question, answer, context } = req.body
    if (!question || !answer) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "question" or "answer"' })
    }

    const prompt = buildEvaluatePrompt(question, answer, context)
    const raw = await callModel(prompt.system, prompt.user, GENERAL_MODELS, { temperature: 0.5 })
    const result = extractJSON(raw, 'evaluation')

    res.json(humanizeResponse(result))
}))

// ─── POST /api/evaluate-conversational ──────────────────────────────
// Conversational evaluation (interactive interview mode)
router.post('/evaluate-conversational', asyncHandler(async (req, res) => {
    const { question, answer, history, context } = req.body
    if (!question || !answer) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "question" or "answer"' })
    }

    const prompt = buildConversationalEvalPrompt(question, answer, history, context)
    const raw = await callModel(prompt.system, prompt.user, CONVERSATIONAL_MODELS, { temperature: 0.7 })
    const result = extractJSON(raw, 'evaluation')

    res.json(humanizeResponse(result))
}))

// ─── POST /api/evaluate-code ─────────────────────────────────────────
// Evaluate a code submission
router.post('/evaluate-code', asyncHandler(async (req, res) => {
    const { question, code, testResults, language } = req.body
    if (!question || !code) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "question" or "code"' })
    }

    const prompt = buildCodeEvalPrompt(question, code, testResults || [], language || 'python')
    const raw = await callModel(prompt.system, prompt.user, CODE_MODELS, { temperature: 0.5 })
    const result = extractJSON(raw, 'evaluation')

    res.json(humanizeResponse(result))
}))

// ─── POST /api/generate-followup ─────────────────────────────────────
// Generate a follow-up question
router.post('/generate-followup', asyncHandler(async (req, res) => {
    const { question, answer, previousFollowUps } = req.body
    if (!question || !answer) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "question" or "answer"' })
    }

    const prompt = buildFollowUpPrompt(question, answer, previousFollowUps || [])
    const raw = await callModel(prompt.system, prompt.user, CONVERSATIONAL_MODELS, { temperature: 0.8 })
    const result = extractJSON(raw)

    res.json(result)
}))

// ─── POST /api/generate-transition ───────────────────────────────────
// Generate a phase transition message
router.post('/generate-transition', asyncHandler(async (req, res) => {
    const { fromPhase, toPhase, performance } = req.body

    const prompt = buildTransitionPrompt(fromPhase, toPhase, performance)
    const raw = await callModel(prompt.system, prompt.user, CONVERSATIONAL_MODELS, { temperature: 0.8 })
    const result = extractJSON(raw)

    res.json(result)
}))

// ─── POST /api/generate-intro ────────────────────────────────────────
// Generate introduction for interview session
router.post('/generate-intro', asyncHandler(async (req, res) => {
    const { topics, difficulty, questionCount } = req.body

    const prompt = buildIntroPrompt(topics, difficulty, questionCount)
    const raw = await callModel(prompt.system, prompt.user, CONVERSATIONAL_MODELS, { temperature: 0.9 })
    const result = extractJSON(raw)

    res.json(result)
}))

// ─── POST /api/generate-wrapup ───────────────────────────────────────
// Generate wrap-up message
router.post('/generate-wrapup', asyncHandler(async (req, res) => {
    const { scores, topics } = req.body

    const prompt = buildWrapUpPrompt(scores || [], topics || [])
    const raw = await callModel(prompt.system, prompt.user, CONVERSATIONAL_MODELS, { temperature: 0.8 })
    const result = extractJSON(raw)

    res.json(result)
}))

// ─── POST /api/report ────────────────────────────────────────────────
// Generate final interview report
router.post('/report', asyncHandler(async (req, res) => {
    const { qaPairs, settings, questionCount } = req.body
    if (!qaPairs?.length) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "qaPairs"' })
    }

    const prompt = buildReportPrompt(qaPairs, settings, questionCount)
    const raw = await callModel(prompt.system, prompt.user, GENERAL_MODELS, {
        temperature: 0.6,
        maxTokens: 8192,
    })
    const result = extractJSON(raw, 'report')

    res.json(humanizeResponse(result))
}))

// ─── POST /api/coaching-tip ──────────────────────────────────────────
// Real-time coaching tip while candidate types
router.post('/coaching-tip', asyncHandler(async (req, res) => {
    const { question, partialAnswer } = req.body
    if (!question || !partialAnswer) {
        return res.status(400).json({ error: 'BadRequest', message: 'Missing "question" or "partialAnswer"' })
    }

    const prompt = buildCoachingTipPrompt(question, partialAnswer)
    const raw = await callModel(prompt.system, prompt.user, GENERAL_MODELS, {
        temperature: 0.5,
        maxTokens: 256,
    })
    const result = extractJSON(raw)

    res.json(result)
}))

export default router
