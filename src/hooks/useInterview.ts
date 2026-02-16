import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getDocument } from '@/lib/documents'
import { saveSession } from '@/lib/sessions'
import { generateQuestions, evaluateAnswer, adjustDifficulty } from '@/lib/interview-engine'
import type { StoredDocument } from '@/types/document'
import type {
    InterviewConfig,
    InterviewSession,
    Question,
    Answer,
    Evaluation,
    Difficulty,
} from '@/types/interview'

type Phase = 'loading' | 'ready' | 'evaluating' | 'completed' | 'error'

export function useInterview(documentId: string, config: InterviewConfig) {
    const { user } = useAuth()
    const [session, setSession] = useState<InterviewSession | null>(null)
    const [phase, setPhase] = useState<Phase>('loading')
    const [error, setError] = useState<string | null>(null)
    const docRef = useRef<StoredDocument | null>(null)
    const currentDifficultyRef = useRef<Difficulty>(config.difficulty)
    const initRef = useRef(false)

    const initialize = useCallback(async () => {
        if (!user || initRef.current) return
        initRef.current = true

        try {
            setPhase('loading')
            setError(null)

            // Load document
            const doc = await getDocument(user.uid, documentId)
            if (!doc) throw new Error('Document not found')
            docRef.current = doc

            // Generate questions
            const questions = await generateQuestions(doc, config)
            if (questions.length === 0) throw new Error('No questions generated')

            const newSession: InterviewSession = {
                id: `session-${Date.now()}`,
                documentId,
                userId: user.uid,
                documentTitle: doc.title,
                config,
                questions,
                answers: [],
                evaluations: [],
                state: 'in-progress',
                currentQuestionIndex: 0,
                startedAt: new Date().toISOString(),
            }

            setSession(newSession)
            setPhase('ready')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start interview')
            setPhase('error')
        }
    }, [user, documentId, config])

    const submitAnswer = useCallback(async (answerText: string) => {
        if (!session || !docRef.current) return
        const question = session.questions[session.currentQuestionIndex]
        if (!question) return

        setPhase('evaluating')

        try {
            const answer: Answer = {
                questionId: question.id,
                text: answerText,
                timestamp: new Date().toISOString(),
            }

            const evaluation = await evaluateAnswer(
                question,
                answerText,
                docRef.current.rawText
            )

            const newAnswers = [...session.answers, answer]
            const newEvaluations = [...session.evaluations, evaluation]

            // Adjust difficulty based on performance
            currentDifficultyRef.current = adjustDifficulty(
                newEvaluations,
                currentDifficultyRef.current
            )

            const isLast = session.currentQuestionIndex >= session.questions.length - 1
            const overallScore = isLast
                ? Math.round(newEvaluations.reduce((s, e) => s + e.score, 0) / newEvaluations.length)
                : undefined

            const completedSession: InterviewSession = {
                ...session,
                answers: newAnswers,
                evaluations: newEvaluations,
                state: isLast ? 'completed' : 'in-progress',
                completedAt: isLast ? new Date().toISOString() : undefined,
                overallScore,
            }

            setSession(completedSession)
            setPhase(isLast ? 'completed' : 'ready')

            // Auto-save to Firestore on completion
            if (isLast && user) {
                saveSession(user.uid, completedSession).catch(() => {
                    // Silent — session data is still in memory
                })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to evaluate answer')
            setPhase('ready') // allow retry
        }
    }, [session])

    const nextQuestion = useCallback(() => {
        if (!session) return
        setSession({
            ...session,
            currentQuestionIndex: session.currentQuestionIndex + 1,
        })
    }, [session])

    const currentQuestion: Question | null =
        session?.questions[session.currentQuestionIndex] ?? null

    const latestEvaluation: Evaluation | null =
        session?.evaluations[session.evaluations.length - 1] ?? null

    // Whether we're showing feedback for the current question (just answered)
    const showingFeedback =
        phase === 'ready' &&
        latestEvaluation != null &&
        latestEvaluation.questionId === currentQuestion?.id

    const progress = session
        ? {
            current: session.answers.length,
            total: session.questions.length,
            score: session.evaluations.length > 0
                ? Math.round(
                    session.evaluations.reduce((s, e) => s + e.score, 0) /
                    session.evaluations.length
                )
                : 0,
        }
        : { current: 0, total: 0, score: 0 }

    return {
        session,
        phase,
        error,
        currentQuestion,
        latestEvaluation,
        showingFeedback,
        progress,
        currentDifficulty: currentDifficultyRef.current,
        initialize,
        submitAnswer,
        nextQuestion,
    }
}
