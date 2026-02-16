// ── Interview Configuration ────────────────────────────────────────
export type Persona = 'socratic' | 'friendly' | 'challenging'
export type QuestionType = 'conceptual' | 'applied' | 'analytical' | 'coding'
export type Difficulty = 'introductory' | 'intermediate' | 'advanced'
export type SessionState = 'configuring' | 'in-progress' | 'completed'

export interface InterviewConfig {
    persona: Persona
    difficulty: Difficulty
    questionCount: number // 5–20
    questionTypes: QuestionType[]
}

// ── Question ───────────────────────────────────────────────────────
export interface Question {
    id: string
    text: string
    type: QuestionType
    topicName: string
    bloomLevel: string
    difficulty: Difficulty
}

// ── Answer ─────────────────────────────────────────────────────────
export interface Answer {
    questionId: string
    text: string
    timestamp: string // ISO string
}

// ── Evaluation ─────────────────────────────────────────────────────
export interface Evaluation {
    questionId: string
    score: number // 0–100
    feedback: string
    conversationalFeedback: string // short, warm, natural feedback
    strengths: string[]
    gaps: string[]
    followUpQuestion?: string
}

// ── Transcript Entry ───────────────────────────────────────────────
export type TranscriptEntryType =
    | 'greeting'
    | 'question'
    | 'answer'
    | 'feedback'
    | 'follow-up'
    | 'transition'
    | 'closing'
    | 'system'

export interface TranscriptEntry {
    id: string
    role: 'ai' | 'user' | 'system'
    type: TranscriptEntryType
    text: string
    timestamp: string // ISO string
    evaluation?: Evaluation // attached to feedback entries
}

// ── Interview Phase ────────────────────────────────────────────────
export type InterviewPhase =
    | 'loading'
    | 'greeting'
    | 'ready'
    | 'awaiting-answer'
    | 'evaluating'
    | 'showing-feedback'
    | 'follow-up'
    | 'completed'
    | 'error'

// ── Interview Session ──────────────────────────────────────────────
export interface InterviewSession {
    id: string
    documentId: string
    userId: string
    documentTitle: string
    config: InterviewConfig
    questions: Question[]
    answers: Answer[]
    evaluations: Evaluation[]
    state: SessionState
    currentQuestionIndex: number
    followUpPending: boolean // whether a follow-up is queued
    startedAt: string // ISO string
    completedAt?: string
    overallScore?: number
}
