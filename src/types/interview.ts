// ── Interview Configuration ────────────────────────────────────────
export type Persona = 'socratic' | 'friendly' | 'challenging'
export type QuestionType = 'conceptual' | 'applied' | 'analytical'
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
    strengths: string[]
    gaps: string[]
    followUpQuestion?: string
}

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
    startedAt: string // ISO string
    completedAt?: string
    overallScore?: number
}
